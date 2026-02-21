import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

// GET - Fetch current user's blocked dates
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    const { data: blockedDates, error } = await supabase
      .from("BlockedDate")
      .select("*")
      .eq("contributorId", userId)
      .gte("date", new Date().toISOString().split("T")[0]) // Only future dates
      .order("date");

    if (error) throw error;

    return NextResponse.json(blockedDates || []);
  } catch (error) {
    console.error("Error fetching blocked dates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a blocked date
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const userRole = (session.user as any).role;

    if (userRole !== "GUIDE" && userRole !== "BOTH" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only guides can block dates" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { date, reason } = body;

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Date must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    // Must be a future date
    const today = new Date().toISOString().split("T")[0];
    if (date <= today) {
      return NextResponse.json(
        { error: "Can only block future dates" },
        { status: 400 }
      );
    }

    const { data: blockedDate, error } = await supabase
      .from("BlockedDate")
      .insert({
        id: uuidv4(),
        contributorId: userId,
        date,
        reason: reason || null,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This date is already blocked" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(blockedDate, { status: 201 });
  } catch (error) {
    console.error("Error creating blocked date:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a blocked date
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Blocked date ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: blockedDate, error: fetchError } = await supabase
      .from("BlockedDate")
      .select("contributorId")
      .eq("id", id)
      .single();

    if (fetchError || !blockedDate) {
      return NextResponse.json(
        { error: "Blocked date not found" },
        { status: 404 }
      );
    }

    if (blockedDate.contributorId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("BlockedDate")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blocked date:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
