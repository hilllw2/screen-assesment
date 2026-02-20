import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json(
        { error: "Missing submissionId" },
        { status: 400 }
      );
    }

    // Fetch 30 random intelligence questions
    const { data: questions, error } = await supabase
      .from("questions")
      .select("id, prompt, option_a, option_b, option_c, option_d")
      .eq("category", "intelligence")
      .eq("is_active", true)
      .limit(30);

    if (error) {
      console.error("Error fetching intelligence questions:", error);
      return NextResponse.json(
        { error: "Failed to load questions", questions: [] },
        { status: 500 }
      );
    }

    const list = questions ?? [];
    if (list.length === 0) {
      console.warn("No intelligence questions found in database. Run: npx tsx scripts/seed-questions.ts");
    }

    // Shuffle questions
    const shuffled = [...list].sort(() => Math.random() - 0.5);

    return NextResponse.json({ questions: shuffled });
  } catch (error) {
    console.error("Error in intelligence GET:", error);
    return NextResponse.json(
      { error: "Internal server error", questions: [] },
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
    const supabase = await createClient();
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
