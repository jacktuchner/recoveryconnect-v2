import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Public endpoint to fetch a contributor's availability
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify the contributor exists and is available for calls
    const { data: contributor, error: contribError } = await supabase
      .from("User")
      .select("id, profile:Profile(isAvailableForCalls)")
      .eq("id", id)
      .single();

    if (contribError || !contributor) {
      return NextResponse.json(
        { error: "Contributor not found" },
        { status: 404 }
      );
    }

    if (!(contributor.profile as any)?.isAvailableForCalls) {
      return NextResponse.json(
        { error: "Contributor is not available for calls" },
        { status: 400 }
      );
    }

    // Fetch availability slots, booked calls, and blocked dates in parallel
    const today = new Date().toISOString().split("T")[0];
    const [slotsResult, callsResult, blockedResult] = await Promise.all([
      supabase
        .from("Availability")
        .select("id, dayOfWeek, startTime, endTime, timezone")
        .eq("contributorId", id)
        .order("dayOfWeek")
        .order("startTime"),
      supabase
        .from("Call")
        .select("scheduledAt, durationMinutes")
        .eq("contributorId", id)
        .in("status", ["REQUESTED", "CONFIRMED"])
        .gte("scheduledAt", new Date().toISOString()),
      supabase
        .from("BlockedDate")
        .select("date")
        .eq("contributorId", id)
        .gte("date", today),
    ]);

    if (slotsResult.error) throw slotsResult.error;

    return NextResponse.json({
      slots: slotsResult.data || [],
      bookedCalls: (callsResult.data || []).map((c) => ({
        start: c.scheduledAt,
        end: new Date(new Date(c.scheduledAt).getTime() + c.durationMinutes * 60000).toISOString(),
      })),
      blockedDates: (blockedResult.data || []).map((d: any) => d.date),
    });
  } catch (error) {
    console.error("Error fetching contributor availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
