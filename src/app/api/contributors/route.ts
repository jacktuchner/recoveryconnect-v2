import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { calculateMatchScore } from "@/lib/matching";
import { getPublicDisplayName } from "@/lib/displayName";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const procedure = searchParams.get("procedure");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    let query = supabase
      .from("User")
      .select("id, name, displayName, showRealName, bio, role, profile:Profile(*), recordings:Recording(*), reviewsReceived:Review(*)", { count: "exact" })
      .in("role", ["CONTRIBUTOR", "BOTH"])
      .not("profile", "is", null);

    if (procedure) {
      // We'll filter in memory since Supabase doesn't support filtering on joined tables directly
    }

    const { data: allContributors, count, error } = await query;

    if (error) throw error;

    // Filter by procedure if specified
    let filteredContributors = allContributors || [];
    if (procedure) {
      filteredContributors = filteredContributors.filter(
        (c: any) => c.profile?.procedureType === procedure
      );
    }

    const total = filteredContributors.length;

    // Paginate
    const paginatedContributors = filteredContributors.slice(
      (page - 1) * limit,
      page * limit
    );

    const session = await getServerSession(authOptions);
    let results: unknown[] = paginatedContributors;

    if (session?.user) {
      const { data: userProfile } = await supabase
        .from("Profile")
        .select("*")
        .eq("userId", (session.user as Record<string, string>).id)
        .single();

      if (userProfile) {
        // Use activeProcedureType for matching, fallback to procedureType
        const activeProc = userProfile.activeProcedureType || userProfile.procedureType;

        // Get per-procedure attributes from procedureProfiles, fallback to legacy fields
        const procProfiles = userProfile.procedureProfiles || {};
        const activeProcProfile = procProfiles[activeProc] || {};

        const seekerGoals = activeProcProfile.recoveryGoals || userProfile.recoveryGoals || [];
        const seekerFactors = activeProcProfile.complicatingFactors || userProfile.complicatingFactors || [];
        const seekerDetails = activeProcProfile.procedureDetails || userProfile.procedureDetails;

        results = paginatedContributors
          .map((c: any) => {
            if (!c.profile)
              return { ...c, matchScore: 0, matchBreakdown: [] };
            const score = calculateMatchScore(
              {
                procedureType: activeProc,
                procedureDetails: seekerDetails,
                ageRange: userProfile.ageRange,
                activityLevel: userProfile.activityLevel,
                recoveryGoals: seekerGoals,
                complicatingFactors: seekerFactors,
                lifestyleContext: userProfile.lifestyleContext,
              },
              {
                procedureType: c.profile.procedureType,
                procedureDetails: c.profile.procedureDetails,
                ageRange: c.profile.ageRange,
                activityLevel: c.profile.activityLevel,
                recoveryGoals: c.profile.recoveryGoals,
                complicatingFactors: c.profile.complicatingFactors,
                lifestyleContext: c.profile.lifestyleContext,
              }
            );
            return {
              ...c,
              matchScore: score.score,
              matchBreakdown: score.breakdown,
            };
          })
          .sort(
            (a: any, b: any) => b.matchScore - a.matchScore
          );
      }
    }

    // Transform names to public display names
    const transformedResults = (results as any[]).map((c) => ({
      ...c,
      name: getPublicDisplayName(c),
      // Remove private fields from response
      displayName: undefined,
      showRealName: undefined,
    }));

    return NextResponse.json({
      contributors: transformedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching contributors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
