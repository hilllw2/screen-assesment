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

    // Log violation
    await supabase.from("submission_violations").insert({
      submission_id: submissionId,
      violation_type: violationType,
      metadata: metadata || {},
      detected_at: new Date().toISOString(),
    });

    // Disqualify submission with proper reason
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        disqualified: true,
        disqualification_reason: violationType,
        disqualified_at: new Date().toISOString(),
        status: "disqualified",
      })
      .eq("id", submissionId);

    if (updateError) {
      console.error(`❌ Failed to disqualify ${submissionId}:`, updateError);
      return NextResponse.json(
        { error: "Failed to update submission" },
        { status: 500 }
      );
    }

    console.log(`✅ Disqualified ${submissionId} for: ${violationType}`);

    return NextResponse.json({
      message: "Violation logged and submission disqualified",
      violationType,
    });
  } catch (error) {
    console.error("Error in violation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
