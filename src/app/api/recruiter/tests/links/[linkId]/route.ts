import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { linkId } = await params;
    const body = await request.json();

    // Verify link belongs to user's test
    const { data: link } = await supabase
      .from("test_links")
      .select("test_id, tests!inner(created_by_user_id)")
      .eq("id", linkId)
      .single();

    if (!link || (link as any).tests.created_by_user_id !== user.id) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Update link
    const updateData: any = {};
    if (typeof body.is_active !== "undefined") {
      updateData.is_active = body.is_active;
    }
    if (body.expires_at !== undefined) {
      updateData.expires_at = body.expires_at;
    }

    const { data: updatedLink, error } = await supabase
      .from("test_links")
      .update(updateData)
      .eq("id", linkId)
      .select()
      .single();

    if (error) {
      console.error("Error updating link:", error);
      return NextResponse.json(
        { error: "Failed to update link" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      link: updatedLink,
      message: "Link updated successfully",
    });
  } catch (error) {
    console.error("Error in PATCH link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { linkId } = await params;

    // Verify link belongs to user's test
    const { data: link } = await supabase
      .from("test_links")
      .select("test_id, tests!inner(created_by_user_id)")
      .eq("id", linkId)
      .single();

    if (!link || (link as any).tests.created_by_user_id !== user.id) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Delete link
    const { error } = await supabase
      .from("test_links")
      .delete()
      .eq("id", linkId);

    if (error) {
      console.error("Error deleting link:", error);
      return NextResponse.json(
        { error: "Failed to delete link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Link deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
