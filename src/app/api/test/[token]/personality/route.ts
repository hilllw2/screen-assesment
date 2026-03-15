import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const TRAITS = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"] as const;
type Trait = typeof TRAITS[number];

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
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    // Fetch 2 random questions per trait (10 total)
    const selected: any[] = [];

    for (const trait of TRAITS) {
      const { data, error } = await supabase
        .from("questions")
        .select("id, prompt, option_a, option_b, option_c, option_d, option_e, trait, category")
        .eq("category", "personality")
        .eq("trait", trait)
        .eq("is_active", true);

      if (error) {
        console.error(`Error fetching ${trait} questions:`, error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
      }

      const shuffled = (data ?? []).sort(() => Math.random() - 0.5);
      // Pick 2 per trait
      selected.push(...shuffled.slice(0, 2).map(({ id, prompt, option_a, option_b, option_c, option_d, option_e, trait }) => ({
        id, prompt, option_a, option_b, option_c, option_d, option_e, trait,
      })));
    }

    // Final shuffle so traits are interleaved
    const finalQuestions = selected.sort(() => Math.random() - 0.5);

    return NextResponse.json({ questions: finalQuestions });
  } catch (error) {
    console.error("Error in personality GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const questionIds = Object.keys(answers);

    // Fetch questions with scores and trait
    const { data: questions } = await supabase
      .from("questions")
      .select("id, trait, score_option_a, score_option_b, score_option_c, score_option_d, score_option_e")
      .in("id", questionIds);

    if (!questions) {
      return NextResponse.json({ error: "Questions not found" }, { status: 404 });
    }

    // Per-trait raw score accumulator: trait -> { sum, count }
    const traitData: Record<Trait, { sum: number; count: number }> = {
      openness: { sum: 0, count: 0 },
      conscientiousness: { sum: 0, count: 0 },
      extraversion: { sum: 0, count: 0 },
      agreeableness: { sum: 0, count: 0 },
      neuroticism: { sum: 0, count: 0 },
    };

    const answerRecords = [];

    for (const question of questions) {
      const selectedOption = (answers[question.id] as string).toLowerCase();
      let scoreAwarded = 0;

      switch (selectedOption) {
        case "a": scoreAwarded = question.score_option_a || 0; break;
        case "b": scoreAwarded = question.score_option_b || 0; break;
        case "c": scoreAwarded = question.score_option_c || 0; break;
        case "d": scoreAwarded = question.score_option_d || 0; break;
        case "e": scoreAwarded = question.score_option_e || 0; break;
      }

      const trait = (question.trait as Trait);
      if (trait && traitData[trait]) {
        traitData[trait].sum += scoreAwarded;
        traitData[trait].count += 1;
      }

      answerRecords.push({
        submission_id: submissionId,
        question_id: question.id,
        selected_option: selectedOption,
        is_correct: null,
        score_awarded: scoreAwarded,
      });
    }

    // Insert all answers
    const { error: answerError } = await supabase
      .from("submission_answers")
      .insert(answerRecords);

    if (answerError) {
      console.error("Error saving answers:", answerError);
      return NextResponse.json({ error: "Failed to save answers" }, { status: 500 });
    }

    // Normalize each trait to 0-100% scale
    // Min per trait = 2 questions × 1 point = 2, Max = 2 × 5 = 10
    const normalize = (raw: number, count: number): number => {
      if (count === 0) return 0;
      const min = count * 1;
      const max = count * 5;
      return Math.round(((raw - min) / (max - min)) * 100 * 10) / 10;
    };

    const opennessPercent = normalize(traitData.openness.sum, traitData.openness.count);
    const conscientiousnessPercent = normalize(traitData.conscientiousness.sum, traitData.conscientiousness.count);
    const extraversionPercent = normalize(traitData.extraversion.sum, traitData.extraversion.count);
    const agreeablenessPercent = normalize(traitData.agreeableness.sum, traitData.agreeableness.count);
    const neuroticismPercent = normalize(traitData.neuroticism.sum, traitData.neuroticism.count);

    // Overall personality score = average of 5 traits (0-100)
    const traitPercentages = [
      opennessPercent,
      conscientiousnessPercent,
      extraversionPercent,
      agreeablenessPercent,
      neuroticismPercent,
    ];
    const validTraits = traitPercentages.filter((_, i) => TRAITS.map(t => traitData[t].count).at(i)! > 0);
    const overallPercent = validTraits.length > 0
      ? Math.round((validTraits.reduce((a, b) => a + b, 0) / validTraits.length) * 10) / 10
      : 0;

    // Upsert submission_scores with per-trait + overall
    const { error: scoreError } = await supabase
      .from("submission_scores")
      .update({
        personality_score: overallPercent,
        openness_score: opennessPercent,
        conscientiousness_score: conscientiousnessPercent,
        extraversion_score: extraversionPercent,
        agreeableness_score: agreeablenessPercent,
        neuroticism_score: neuroticismPercent,
        updated_at: new Date().toISOString(),
      })
      .eq("submission_id", submissionId);

    if (scoreError) {
      console.error("Error updating scores:", scoreError);
    }

    return NextResponse.json({
      message: "Answers saved successfully",
      personality_score: overallPercent,
      traits: {
        openness: opennessPercent,
        conscientiousness: conscientiousnessPercent,
        extraversion: extraversionPercent,
        agreeableness: agreeablenessPercent,
        neuroticism: neuroticismPercent,
      },
    });
  } catch (error) {
    console.error("Error in personality POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
