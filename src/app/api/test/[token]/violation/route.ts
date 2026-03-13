import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createServiceRoleClient();
    const body = await request.json();
    const { submissionId, violationType, metadata } = body;

    if (!submissionId || !violationType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log violation in submission_violations table
    // This allows admin to review violations without auto-disqualifying
    const { error: violationError } = await supabase.from("submission_violations").insert({
      submission_id: submissionId,
      violation_type: violationType,
      metadata: metadata || {},
      detected_at: new Date().toISOString(),
    });

    if (violationError) {
      console.error(`❌ Failed to log violation for ${submissionId}:`, violationError);
      return NextResponse.json(
        { error: "Failed to log violation" },
        { status: 500 }
      );
    }

    // Do NOT auto-disqualify - just log the violation
    // Admin can review violations and manually disqualify if needed
    console.log(`⚠️ Violation logged for ${submissionId}: ${violationType} (not auto-disqualified)`);

    return NextResponse.json({
      message: "Violation logged for review",
      violationType,
      warning: "This behavior has been recorded and will be reviewed.",
    });
  } catch (error) {
    console.error("Error in violation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
