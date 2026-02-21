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
    const { submissionId, audioUrl } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "Missing submissionId" },
        { status: 400 }
      );
    }

    // Update submission with combined audio recording URL
    console.log("💾 Saving combined verbal audio to DB:", {
      submissionId,
      audioUrl: audioUrl || "null",
    });
    
    const { error, data } = await supabase
      .from("submissions")
      .update({
        audio_recording_url: audioUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select();

    if (error) {
      console.error("❌ Error saving verbal recording:", error);
      return NextResponse.json(
        { error: "Failed to save recording", details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Verbal recording saved successfully:", data);

    return NextResponse.json({
      message: "Verbal recording saved successfully",
    });
  } catch (error) {
    console.error("Error in verbal API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
