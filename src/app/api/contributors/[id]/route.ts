import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getPublicDisplayName } from "@/lib/displayName";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: contributor, error } = await supabase
      .from("User")
      .select("*, profile:Profile(*), recordings:Recording(*, reviews:Review(*, author:User!Review_authorId_fkey(name, displayName, showRealName)))")
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

    // Sort and limit reviews, and transform author names
    contributor.reviewsReceived = allReviews
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((review: any) => ({
        ...review,
        author: review.author
          ? {
              name: getPublicDisplayName(review.author),
            }
          : null,
      }));

    // Transform contributor name to public display name
    const publicName = getPublicDisplayName(contributor);

    const { passwordHash, displayName, showRealName, ...safe } = contributor as Record<string, unknown>;
    return NextResponse.json({
      ...safe,
      name: publicName,
    });
  } catch (error) {
    console.error("Error fetching contributor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
