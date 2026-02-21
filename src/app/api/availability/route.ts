import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

// GET - Fetch current user's availability slots
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    const { data: slots, error } = await supabase
      .from("Availability")
      .select("*")
      .eq("contributorId", userId)
      .order("dayOfWeek")
      .order("startTime");

    if (error) throw error;

    return NextResponse.json(slots || []);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a new availability slot
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const userRole = (session.user as any).role;

    // Only contributors can set availability
    if (userRole !== "GUIDE" && userRole !== "BOTH" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only contributors can set availability" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { dayOfWeek, startTime, endTime, timezone } = body;

    // Validate required fields
    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: "dayOfWeek, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    // Validate dayOfWeek is 0-6
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)" },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "Times must be in HH:MM format (24-hour)" },
        { status: 400 }
      );
    }

    // Validate endTime > startTime
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Check for overlapping slots on the same day
    const { data: existingSlots } = await supabase
      .from("Availability")
      .select("*")
      .eq("contributorId", userId)
      .eq("dayOfWeek", dayOfWeek);

    if (existingSlots) {
      for (const slot of existingSlots) {
        // Check if new slot overlaps with existing slot
        if (
          (startTime >= slot.startTime && startTime < slot.endTime) ||
          (endTime > slot.startTime && endTime <= slot.endTime) ||
          (startTime <= slot.startTime && endTime >= slot.endTime)
        ) {
          return NextResponse.json(
            { error: "This slot overlaps with an existing availability slot" },
            { status: 409 }
          );
        }
      }
    }

    const { data: slot, error } = await supabase
      .from("Availability")
      .insert({
        id: uuidv4(),
        contributorId: userId,
        dayOfWeek,
        startTime,
        endTime,
        timezone: timezone || "America/New_York",
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    console.error("Error creating availability slot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove an availability slot
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const { searchParams } = new URL(req.url);
    const slotId = searchParams.get("id");

    if (!slotId) {
      return NextResponse.json(
        { error: "Slot ID is required" },
        { status: 400 }
      );
    }

    // Verify the slot belongs to the user
    const { data: slot, error: fetchError } = await supabase
      .from("Availability")
      .select("contributorId")
      .eq("id", slotId)
      .single();

    if (fetchError || !slot) {
      return NextResponse.json(
        { error: "Slot not found" },
        { status: 404 }
      );
    }

    if (slot.contributorId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("Availability")
      .delete()
      .eq("id", slotId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting availability slot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
