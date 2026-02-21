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
    const { submissionId, verbalQuestion1Url, verbalQuestion2Url, verbalQuestion3Url } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "Missing submissionId" },
        { status: 400 }
      );
    }

    // Update submission with individual verbal question URLs
    console.log("💾 Saving verbal question URLs to DB:", {
      submissionId,
      verbalQuestion1Url: verbalQuestion1Url || "null",
      verbalQuestion2Url: verbalQuestion2Url || "null",
      verbalQuestion3Url: verbalQuestion3Url || "null",
    });
    
    const { error, data } = await supabase
      .from("submissions")
      .update({
        verbal_question_1_url: verbalQuestion1Url,
        verbal_question_2_url: verbalQuestion2Url,
        verbal_question_3_url: verbalQuestion3Url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select();

    if (error) {
      console.error("❌ Error saving verbal responses:", error);
      return NextResponse.json(
        { error: "Failed to save responses", details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Verbal responses saved successfully:", data);

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
