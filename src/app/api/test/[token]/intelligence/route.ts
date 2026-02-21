import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json(
        { error: "Missing submissionId" },
        { status: 400 }
      );
    }

    // Fetch questions: include category so we can match case-insensitively (Postgres enum may be stored with different casing)
    const { data: rawQuestions, error } = await supabase
      .from("questions")
      .select("id, prompt, option_a, option_b, option_c, option_d, category")
      .eq("is_active", true)
      .limit(100);

    if (error) {
      console.error("Error fetching intelligence questions:", error);
      return NextResponse.json(
        { error: "Failed to load questions", details: error.message, questions: [] },
        { status: 500 }
      );
    }

    const all = rawQuestions ?? [];
    const list = all
      .filter((q) => String((q as { category?: string }).category ?? "").toLowerCase() === "intelligence")
      .slice(0, 30);

    if (list.length === 0 && all.length > 0) {
      console.warn(
        "Intelligence questions: 0 matched. Total active questions:",
        all.length,
        "Sample categories:",
        [...new Set(all.map((q) => (q as { category?: string }).category))]
      );
    } else if (list.length === 0) {
      console.warn("No active questions in database. Seed with: npx tsx scripts/seed-questions.ts");
    }

    // Shuffle and return only needed fields
    const shuffled = [...list]
      .sort(() => Math.random() - 0.5)
      .map(({ id, prompt, option_a, option_b, option_c, option_d }) => ({
        id,
        prompt,
        option_a,
        option_b,
        option_c,
        option_d,
      }));

    const payload: { questions: typeof shuffled; debug?: { totalActive: number; categoriesSeen: string[] } } = {
      questions: shuffled,
    };
    if (shuffled.length === 0 && process.env.NODE_ENV !== "production") {
      payload.debug = {
        totalActive: all.length,
        categoriesSeen: [...new Set(all.map((q) => String((q as { category?: string }).category ?? "null")))],
      };
    }
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error in intelligence GET:", error);
    const isEnvError = message.includes("SUPABASE_SERVICE_ROLE_KEY") || message.includes("Missing");
    return NextResponse.json(
      {
        error: isEnvError ? "Server config: " + message : "Internal server error",
        questions: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createServiceRoleClient();
    const body = await request.json();
    const { submissionId, answers } = body;

    if (!submissionId || !answers) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch questions with correct answers
    const questionIds = Object.keys(answers);
    const { data: questions } = await supabase
      .from("questions")
      .select("id, correct_option")
      .in("id", questionIds);

    if (!questions) {
      return NextResponse.json(
        { error: "Questions not found" },
        { status: 404 }
      );
    }

    // Calculate score and save answers
    let correctCount = 0;
    const answerRecords = [];

    for (const question of questions) {
      const selectedOption = answers[question.id];
      const isCorrect =
        selectedOption.toLowerCase() === question.correct_option?.toLowerCase();
      
      if (isCorrect) correctCount++;

      answerRecords.push({
        submission_id: submissionId,
        question_id: question.id,
        selected_option: selectedOption,
        is_correct: isCorrect,
        score_awarded: isCorrect ? 1 : 0,
      });
    }

    // Insert all answers
    const { error: answerError } = await supabase
      .from("submission_answers")
      .insert(answerRecords);

    if (answerError) {
      console.error("Error saving answers:", answerError);
      return NextResponse.json(
        { error: "Failed to save answers" },
        { status: 500 }
      );
    }

    // Calculate percentage score
    const score = (correctCount / questions.length) * 100;

    // Update submission_scores
    const { error: scoreError } = await supabase
      .from("submission_scores")
      .update({ intelligence_score: score })
      .eq("submission_id", submissionId);

    if (scoreError) {
      console.error("Error updating score:", scoreError);
    }

    return NextResponse.json({
      message: "Answers saved successfully",
      score,
      correctCount,
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error("Error in intelligence POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
