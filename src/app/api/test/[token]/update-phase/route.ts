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
    const { submissionId, phase } = body;

    if (!submissionId || !phase) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update submission phase
    const { error } = await supabase
      .from("submissions")
      .update({
        current_phase: phase,
        phase_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (error) {
      console.error("Error updating phase:", error);
      return NextResponse.json(
        { error: "Failed to update phase" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Phase updated successfully",
    });
  } catch (error) {
    console.error("Error in update-phase API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
