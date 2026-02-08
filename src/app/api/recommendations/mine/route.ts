import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    // Get all endorsements by this contributor
    const { data: endorsements, error: endorseError } = await supabase
      .from("RecommendationEndorsement")
      .select("recommendationId, comment, recoveryPhase")
      .eq("contributorId", userId);

    if (endorseError) throw endorseError;

    if (!endorsements || endorsements.length === 0) {
      return NextResponse.json([]);
    }

    const recIds = endorsements.map((e) => e.recommendationId);

    const { data: recommendations, error: recError } = await supabase
      .from("Recommendation")
      .select(
        "*, endorsements:RecommendationEndorsement(id, contributorId, comment, recoveryPhase, contributor:User!RecommendationEndorsement_contributorId_fkey(id, name, image))"
      )
      .in("id", recIds)
      .eq("status", "ACTIVE")
      .order("createdAt", { ascending: false });

    if (recError) throw recError;

    return NextResponse.json(recommendations || []);
  } catch (error) {
    console.error("Error fetching my recommendations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
