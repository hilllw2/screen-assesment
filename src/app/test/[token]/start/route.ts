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
    const email = formData.get("email") as string | null;
    const upwork_profile_url = formData.get("upwork_profile_url") as string | null;
    const { token } = await params;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Must have either email or upwork profile URL
    if (!email && !upwork_profile_url) {
      return NextResponse.json(
        { error: "Email or Upwork profile URL is required" },
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

    // Create or find candidate based on what info we have
    let candidateId;
    
    if (email) {
      // Look up by email
      const { data: existingCandidate } = await supabase
        .from("candidates")
        .select("id")
        .eq("email", email)
        .maybeSingle();

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
          .insert({ name, email, upwork_profile_url: null })
          .select()
          .single();
        
        if (candidateError || !newCandidate) {
          // Handle race conditions
          const { data: fallbackCandidate } = await supabase
            .from("candidates")
            .select("id")
            .eq("email", email)
            .maybeSingle();

          if (!fallbackCandidate) {
            console.error("Error creating candidate:", candidateError);
            return NextResponse.json(
              { error: "Failed to create candidate" },
              { status: 500 }
            );
          }

          candidateId = fallbackCandidate.id;
        } else {
          candidateId = newCandidate.id;
        }
      }
    } else {
      // Upwork candidate - look up by upwork_profile_url
      const { data: existingCandidate } = await supabase
        .from("candidates")
        .select("id")
        .eq("upwork_profile_url", upwork_profile_url)
        .maybeSingle();

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
          .insert({ name, email: null, upwork_profile_url })
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
    }

    // Check for duplicate submission - prevent candidate from taking same test twice
    const { data: existingSubmission } = await supabase
      .from("submissions")
      .select("id, status, submitted_at")
      .eq("candidate_id", candidateId)
      .eq("test_id", (testLink as any).tests.id)
      .maybeSingle();

    if (existingSubmission) {
      // Candidate already has a submission for this test
      if (existingSubmission.status === "submitted" || existingSubmission.submitted_at) {
        // Already completed - don't allow retake
        return NextResponse.json(
          { 
            error: "You have already completed this test. Each candidate can only take the test once.",
            code: "DUPLICATE_SUBMISSION"
          },
          { status: 409 } // 409 Conflict
        );
      } else {
        // Has in-progress submission - redirect to it instead of creating new one
        const test = (testLink as any).tests;
        const redirectUrl = test.type === "screening" 
          ? `/test/${token}/guidelines?sid=${existingSubmission.id}`
          : `/test/${token}/upwork?sid=${existingSubmission.id}`;
        
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
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
