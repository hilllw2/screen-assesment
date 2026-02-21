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
    const { submissionId, videoUrl } = body;

    if (!submissionId || !videoUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update submission with video URL and mark as submitted
    const { error } = await supabase
      .from("submissions")
      .update({
        video_recording_url: videoUrl,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (error) {
      console.error("Error saving upwork video:", error);
      return NextResponse.json(
        { error: "Failed to save video" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Video saved successfully",
    });
  } catch (error) {
    console.error("Error in upwork API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
