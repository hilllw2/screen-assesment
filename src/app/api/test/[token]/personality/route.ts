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

    // Fetch 20 random personality questions
    const { data: questions, error } = await supabase
      .from("questions")
      .select("id, prompt, option_a, option_b, option_c, option_d")
      .eq("category", "personality")
      .eq("is_active", true)
      .limit(20);

    if (error) {
      console.error("Error fetching questions:", error);
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    // Shuffle questions
    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 20);

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
