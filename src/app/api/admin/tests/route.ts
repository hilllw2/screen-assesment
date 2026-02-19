import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, title } = body;

    if (!type || (type !== "screening" && type !== "upwork")) {
      return NextResponse.json(
        { error: "Invalid test type" },
        { status: 400 }
      );
    }

    // Create the test (created by admin)
    const { data: test, error: testError } = await supabase
      .from("tests")
      .insert({
        created_by_user_id: user.id,
        type,
        title: title || null,
      })
      .select()
      .single();

    if (testError) {
      console.error("Error creating test:", testError);
      return NextResponse.json(
        { error: "Failed to create test" },
        { status: 500 }
      );
    }

    // Automatically create first test link
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Default expiry: 7 days

    const { data: testLink, error: linkError } = await supabase
      .from("test_links")
      .insert({
        test_id: test.id,
        created_by_user_id: user.id,
        is_active: true,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (linkError) {
      console.error("Error creating test link:", linkError);
    }

    return NextResponse.json({
      test,
      testLink,
      message: "Test created successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/admin/tests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    // Fetch all tests (admin can see all)
    const { data: tests, error } = await supabase
      .from("tests")
      .select(
        `
        *,
        test_links (
          id,
          token,
          is_active,
          created_at
        ),
        submissions (
          id,
          status,
          created_at
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tests:", error);
      return NextResponse.json(
        { error: "Failed to fetch tests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tests });
  } catch (error) {
    console.error("Error in GET /api/admin/tests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
