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

    // Verify admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { linkId } = await params;
    const body = await request.json();

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
    console.error("Error in PATCH admin link:", error);
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

    // Verify admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { linkId } = await params;

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
    console.error("Error in DELETE admin link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
