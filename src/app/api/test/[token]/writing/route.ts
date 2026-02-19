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

    // Map task number to column name
    const columnMap: { [key: number]: string } = {
      1: "writing_part_1_text",
      2: "writing_part_2_text",
      3: "writing_part_3_text",
      4: "writing_part_4_text",
      5: "writing_part_5_text",
    };

    const columnName = columnMap[taskNumber];
    if (!columnName) {
      return NextResponse.json(
        { error: "Invalid task number" },
        { status: 400 }
      );
    }

    // Update submission with writing response
    const { error } = await supabase
      .from("submissions")
      .update({
        [columnName]: text,
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
