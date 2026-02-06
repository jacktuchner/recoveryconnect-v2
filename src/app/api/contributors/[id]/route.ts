import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getPublicDisplayName } from "@/lib/displayName";
import { calculateMatchScore } from "@/lib/matching";

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

    // Fetch series, call count, and availability in parallel
    const [seriesResult, callCountResult, availabilityResult] = await Promise.all([
      // Series: published series with their recordings
      supabase
        .from("RecordingSeries")
        .select(
          `id, title, description, discountPercent, status,
          recordings:SeriesRecording(
            recording:Recording(id, title, price)
          )`
        )
        .eq("contributorId", id)
        .eq("status", "PUBLISHED"),

      // Completed call count
      supabase
        .from("Call")
        .select("id", { count: "exact", head: true })
        .eq("contributorId", id)
        .eq("status", "COMPLETED"),

      // Availability slots (only if contributor is available for calls)
      contributor.profile?.isAvailableForCalls
        ? supabase
            .from("Availability")
            .select("id, dayOfWeek, startTime, endTime, timezone")
            .eq("contributorId", id)
            .order("dayOfWeek")
            .order("startTime")
        : Promise.resolve({ data: null }),
    ]);

    const series = (seriesResult.data || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      discountPercent: s.discountPercent,
      recordings: (s.recordings || []).map((sr: any) => sr.recording).filter(Boolean),
    }));

    const completedCallCount = callCountResult.count || 0;
    const availability = availabilityResult.data || [];

    // Match score: only for logged-in patients with a profile
    let matchScore: number | undefined;
    let matchBreakdown: { attribute: string; matched: boolean; weight: number }[] | undefined;

    const session = await getServerSession(authOptions);
    if (session?.user && contributor.profile) {
      const userId = (session.user as any).id;
      // Don't compute match score for own profile
      if (userId !== id) {
        const { data: seekerProfile } = await supabase
          .from("Profile")
          .select("*")
          .eq("userId", userId)
          .single();

        if (seekerProfile) {
          // Use activeProcedureType for matching, fallback to procedureType
          const activeProc = seekerProfile.activeProcedureType || seekerProfile.procedureType;
          const procProfiles = seekerProfile.procedureProfiles || {};
          const activeProcProfile = procProfiles[activeProc] || {};

          const seekerGoals = activeProcProfile.recoveryGoals || seekerProfile.recoveryGoals || [];
          const seekerFactors = activeProcProfile.complicatingFactors || seekerProfile.complicatingFactors || [];
          const seekerDetails = activeProcProfile.procedureDetails || seekerProfile.procedureDetails;

          const result = calculateMatchScore(
            {
              procedureType: activeProc,
              procedureDetails: seekerDetails,
              ageRange: seekerProfile.ageRange,
              activityLevel: seekerProfile.activityLevel,
              recoveryGoals: seekerGoals,
              complicatingFactors: seekerFactors,
              lifestyleContext: seekerProfile.lifestyleContext || [],
            },
            {
              procedureType: contributor.profile.procedureType,
              procedureTypes: contributor.profile.procedureTypes,
              procedureDetails: contributor.profile.procedureDetails,
              ageRange: contributor.profile.ageRange,
              activityLevel: contributor.profile.activityLevel,
              recoveryGoals: contributor.profile.recoveryGoals || [],
              complicatingFactors: contributor.profile.complicatingFactors || [],
              lifestyleContext: contributor.profile.lifestyleContext || [],
            }
          );
          matchScore = result.score;
          matchBreakdown = result.breakdown;
        }
      }
    }

    // Transform contributor name to public display name
    const publicName = getPublicDisplayName(contributor);

    const { passwordHash, displayName, showRealName, ...safe } = contributor as Record<string, unknown>;
    return NextResponse.json({
      ...safe,
      name: publicName,
      series,
      completedCallCount,
      availability,
      ...(matchScore !== undefined && { matchScore, matchBreakdown }),
    });
  } catch (error) {
    console.error("Error fetching contributor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
