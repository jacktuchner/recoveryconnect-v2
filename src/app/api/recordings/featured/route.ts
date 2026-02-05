import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Fetch 6 published recordings, ordered by most recent
    const { data: recordings, error } = await supabase
      .from("Recording")
      .select(
        "id, title, description, category, procedureType, ageRange, activityLevel, price, durationSeconds, isVideo, viewCount, contributor:User!Recording_contributorId_fkey(id, name), reviews:Review(rating)"
      )
      .eq("status", "PUBLISHED")
      .order("createdAt", { ascending: false })
      .limit(6);

    if (error) throw error;

    // Calculate average rating for each recording
    const enrichedRecordings = (recordings || []).map((rec: any) => ({
      ...rec,
      averageRating: rec.reviews?.length
        ? rec.reviews.reduce((a: number, r: { rating: number }) => a + r.rating, 0) / rec.reviews.length
        : undefined,
      reviewCount: rec.reviews?.length || 0,
      reviews: undefined, // Remove reviews array from response
    }));

    return NextResponse.json({ recordings: enrichedRecordings });
  } catch (error) {
    console.error("Error fetching featured recordings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
