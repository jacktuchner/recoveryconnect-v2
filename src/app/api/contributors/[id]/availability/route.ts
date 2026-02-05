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

    // Fetch availability slots
    const { data: slots, error } = await supabase
      .from("Availability")
      .select("id, dayOfWeek, startTime, endTime, timezone")
      .eq("contributorId", id)
      .order("dayOfWeek")
      .order("startTime");

    if (error) throw error;

    return NextResponse.json(slots || []);
  } catch (error) {
    console.error("Error fetching contributor availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
