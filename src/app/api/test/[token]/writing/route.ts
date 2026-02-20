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
    const { submissionId, taskNumber, text } = body;

    if (!submissionId || !taskNumber || text === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }


    // Always save to writing_part_1_text
    const { error } = await supabase
      .from("submissions")
      .update({
        writing_part_1_text: text,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (error) {
      console.error("Error saving writing response:", error);
      return NextResponse.json(
        { error: "Failed to save response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Response saved successfully",
    });
  } catch (error) {
    console.error("Error in writing API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
