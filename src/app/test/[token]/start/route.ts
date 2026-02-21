import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = createServiceRoleClient();
    const formData = await request.formData();
    
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const { token } = await params;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Fetch test link
    const { data: testLink } = await supabase
      .from("test_links")
      .select("*, tests(*)")
      .eq("token", token)
      .single();

    if (!testLink || !testLink.is_active) {
      return NextResponse.json(
        { error: "Invalid or inactive test link" },
        { status: 404 }
      );
    }

    // Create or find candidate
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", email)
      .single();

    let candidateId;
    if (existingCandidate) {
      candidateId = existingCandidate.id;
      // Update name if changed
      await supabase
        .from("candidates")
        .update({ name })
        .eq("id", candidateId);
    } else {
      const { data: newCandidate, error: candidateError } = await supabase
        .from("candidates")
        .insert({ name, email })
        .select()
        .single();
      
      if (candidateError || !newCandidate) {
        console.error("Error creating candidate:", candidateError);
        return NextResponse.json(
          { error: "Failed to create candidate" },
          { status: 500 }
        );
      }
      
      candidateId = newCandidate.id;
    }

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        test_id: (testLink as any).tests.id,
        test_link_id: testLink.id,
        candidate_id: candidateId,
        status: "in_progress",
        current_phase: "guidelines",
        phase_started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (submissionError) {
      console.error("Error creating submission:", submissionError);
      return NextResponse.json(
        { error: "Failed to create submission" },
        { status: 500 }
      );
    }

    // Create initial scores record
    await supabase.from("submission_scores").insert({
      submission_id: submission.id,
      intelligence_score: 0,
      personality_score: 0,
    });

    // Create initial notes record
    await supabase.from("submission_notes").insert({
      submission_id: submission.id,
    });

    // Redirect to appropriate page based on test type
    const test = (testLink as any).tests;
    if (test.type === "screening") {
      return NextResponse.redirect(
        new URL(`/test/${token}/guidelines?sid=${submission.id}`, request.url)
      );
    } else {
      return NextResponse.redirect(
        new URL(`/test/${token}/upwork?sid=${submission.id}`, request.url)
      );
    }
  } catch (error) {
    console.error("Error in start test:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
