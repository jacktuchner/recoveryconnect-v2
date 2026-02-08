import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as Record<string, string>).id : null;
    const userRole = (session?.user as any)?.role;
    const isContributor = userRole === "CONTRIBUTOR" || userRole === "BOTH" || userRole === "ADMIN";
    const isSubscriber = (session?.user as any)?.subscriptionStatus === "active";

    if (!isContributor && !isSubscriber) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }

    const { data: recommendation, error } = await supabase
      .from("Recommendation")
      .select(
        "*, endorsements:RecommendationEndorsement(id, contributorId, comment, recoveryPhase, source, createdAt, contributor:User!RecommendationEndorsement_contributorId_fkey(id, name, image)), createdBy:User!Recommendation_createdById_fkey(id, name, image)"
      )
      .eq("id", id)
      .eq("status", "ACTIVE")
      .single();

    if (error || !recommendation) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    // Check if user has voted
    let hasVoted = false;
    if (userId) {
      const { data: vote } = await supabase
        .from("RecommendationVote")
        .select("id")
        .eq("recommendationId", id)
        .eq("userId", userId)
        .single();

      hasVoted = !!vote;
    }

    return NextResponse.json({ ...recommendation, hasVoted });
  } catch (error) {
    console.error("Error fetching recommendation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const userRole = (session.user as any).role;

    // Check ownership or admin
    const { data: rec } = await supabase
      .from("Recommendation")
      .select("createdById")
      .eq("id", id)
      .single();

    if (!rec) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    if (rec.createdById !== userId && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized to edit this recommendation" }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };

    if (body.name !== undefined) {
      updates.name = body.name.trim();
      updates.normalizedName = body.name.trim().toLowerCase();
    }
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.location !== undefined) updates.location = body.location?.trim() || null;
    if (body.url !== undefined) updates.url = body.url?.trim() || null;
    if (body.priceRange !== undefined) updates.priceRange = body.priceRange || null;

    const { data: updated, error } = await supabase
      .from("Recommendation")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating recommendation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
