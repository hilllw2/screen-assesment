import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
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

    const { testId } = await params;

    // Fetch test details
    const { data: test, error: testError } = await supabase
      .from("tests")
      .select("*")
      .eq("id", testId)
      .single();

    if (testError || !test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Fetch test links with submission counts
    const { data: links, error: linksError } = await supabase
      .from("test_links")
      .select(
        `
        *,
        submissions (count)
      `
      )
      .eq("test_id", testId)
      .order("created_at", { ascending: false });

    if (linksError) {
      console.error("Error fetching links:", linksError);
      return NextResponse.json(
        { error: "Failed to fetch links" },
        { status: 500 }
      );
    }

    return NextResponse.json({ test, links });
  } catch (error) {
    console.error("Error in GET admin test links:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
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

    const { testId } = await params;

    // Verify test exists
    const { data: test } = await supabase
      .from("tests")
      .select("id")
      .eq("id", testId)
      .single();

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Create new test link
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Default expiry: 7 days

    const { data: newLink, error: linkError } = await supabase
      .from("test_links")
      .insert({
        test_id: testId,
        created_by_user_id: user.id,
        is_active: true,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (linkError) {
      console.error("Error creating link:", linkError);
      return NextResponse.json(
        { error: "Failed to create link" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      link: newLink,
      message: "Test link created successfully",
    });
  } catch (error) {
    console.error("Error in POST admin test link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
