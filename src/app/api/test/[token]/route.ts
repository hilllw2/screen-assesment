import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createServiceRoleClient();

    const { data: testLink, error } = await supabase
      .from("test_links")
      .select(`
        *,
        tests (
          id,
          type,
          title,
          candidate_info_type,
          created_at
        )
      `)
      .eq("token", token)
      .single();

    if (error || !testLink) {
      return NextResponse.json(
        { error: "Invalid test link" },
        { status: 404 }
      );
    }

    return NextResponse.json({ testLink });
  } catch (error) {
    console.error("Error fetching test link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
