import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { submissionId, verbalQuestion1Url, verbalQuestion2Url, verbalQuestion3Url } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "Missing submissionId" },
        { status: 400 }
      );
    }

    // Update submission with individual verbal question URLs
    const { error } = await supabase
      .from("submissions")
      .update({
        verbal_question_1_url: verbalQuestion1Url,
        verbal_question_2_url: verbalQuestion2Url,
        verbal_question_3_url: verbalQuestion3Url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (error) {
      console.error("Error saving verbal responses:", error);
      return NextResponse.json(
        { error: "Failed to save responses" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verbal responses saved successfully",
    });
  } catch (error) {
    console.error("Error in verbal API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
