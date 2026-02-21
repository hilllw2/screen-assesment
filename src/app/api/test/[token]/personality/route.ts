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

    // Fetch questions; filter by category in JS (handles enum casing, e.g. 'personality' vs 'Personality')
    const { data: rawQuestions, error } = await supabase
      .from("questions")
      .select("id, prompt, option_a, option_b, option_c, option_d, category")
      .eq("is_active", true)
      .limit(100);

    if (error) {
      console.error("Error fetching personality questions:", error);
      return NextResponse.json(
        { error: "Failed to fetch questions", details: error.message },
        { status: 500 }
      );
    }

    const all = rawQuestions ?? [];
    const list = all
      .filter((q) => String((q as { category?: string }).category ?? "").toLowerCase() === "personality")
      .slice(0, 20);

    const shuffled = [...list].sort(() => Math.random() - 0.5).map(({ id, prompt, option_a, option_b, option_c, option_d }) => ({
      id,
      prompt,
      option_a,
      option_b,
      option_c,
      option_d,
    }));

    return NextResponse.json({ questions: shuffled });
  } catch (error) {
    console.error("Error in personality GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    // Fetch questions with scores
    const questionIds = Object.keys(answers);
    const { data: questions } = await supabase
      .from("questions")
      .select("id, score_option_a, score_option_b, score_option_c, score_option_d")
      .in("id", questionIds);

    if (!questions) {
      return NextResponse.json(
        { error: "Questions not found" },
        { status: 404 }
      );
    }

    // Calculate total score and save answers
    let totalScore = 0;
    const answerRecords = [];

    for (const question of questions) {
      const selectedOption = answers[question.id].toLowerCase();
      let scoreAwarded = 0;

      switch (selectedOption) {
        case "a":
          scoreAwarded = question.score_option_a || 0;
          break;
        case "b":
          scoreAwarded = question.score_option_b || 0;
          break;
        case "c":
          scoreAwarded = question.score_option_c || 0;
          break;
        case "d":
          scoreAwarded = question.score_option_d || 0;
          break;
      }

      totalScore += scoreAwarded;

      answerRecords.push({
        submission_id: submissionId,
        question_id: question.id,
        selected_option: selectedOption,
        is_correct: null, // Not applicable for personality
        score_awarded: scoreAwarded,
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

    // Update submission_scores
    const { error: scoreError } = await supabase
      .from("submission_scores")
      .update({ personality_score: totalScore })
      .eq("submission_id", submissionId);

    if (scoreError) {
      console.error("Error updating score:", scoreError);
    }

    return NextResponse.json({
      message: "Answers saved successfully",
      score: totalScore,
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error("Error in personality POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
