import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: contributor, error } = await supabase
      .from("User")
      .select("*, profile:Profile(*), recordings:Recording(*, reviews:Review(*, author:User!Review_authorId_fkey(name)))")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Contributor not found", details: error.message },
        { status: 404 }
      );
    }

    if (!contributor) {
      return NextResponse.json(
        { error: "Contributor not found" },
        { status: 404 }
      );
    }

    // Filter recordings to only published ones and sort
    if (contributor.recordings) {
      contributor.recordings = contributor.recordings
        .filter((r: any) => r.status === "PUBLISHED")
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Collect all reviews from recordings for reviewsReceived
    const allReviews: any[] = [];
    if (contributor.recordings) {
      contributor.recordings.forEach((rec: any) => {
        if (rec.reviews) {
          rec.reviews.forEach((review: any) => {
            allReviews.push(review);
          });
        }
      });
    }

    // Sort and limit reviews
    contributor.reviewsReceived = allReviews
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const { passwordHash, ...safe } = contributor as Record<string, unknown>;
    return NextResponse.json(safe);
  } catch (error) {
    console.error("Error fetching contributor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
