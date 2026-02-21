import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function POST(
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
    const isContributor = userRole === "GUIDE" || userRole === "BOTH" || userRole === "ADMIN";
    const isSubscriber = (session.user as any).subscriptionStatus === "active";

    if (!isContributor && !isSubscriber) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }

    // Verify recommendation exists
    const { data: rec } = await supabase
      .from("Recommendation")
      .select("id, helpfulCount")
      .eq("id", id)
      .eq("status", "ACTIVE")
      .single();

    if (!rec) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    // Check existing vote
    const { data: existingVote } = await supabase
      .from("RecommendationVote")
      .select("id")
      .eq("recommendationId", id)
      .eq("userId", userId)
      .single();

    const now = new Date().toISOString();

    if (existingVote) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from("RecommendationVote")
        .delete()
        .eq("id", existingVote.id);

      if (deleteError) throw deleteError;

      await supabase
        .from("Recommendation")
        .update({
          helpfulCount: Math.max(0, (rec.helpfulCount || 1) - 1),
          updatedAt: now,
        })
        .eq("id", id);

      return NextResponse.json({ voted: false, helpfulCount: Math.max(0, (rec.helpfulCount || 1) - 1) });
    }

    // Add vote
    const { error: insertError } = await supabase
      .from("RecommendationVote")
      .insert({
        id: uuidv4(),
        recommendationId: id,
        userId,
        createdAt: now,
      });

    if (insertError) throw insertError;

    await supabase
      .from("Recommendation")
      .update({
        helpfulCount: (rec.helpfulCount || 0) + 1,
        updatedAt: now,
      })
      .eq("id", id);

    return NextResponse.json({ voted: true, helpfulCount: (rec.helpfulCount || 0) + 1 });
  } catch (error) {
    console.error("Error toggling vote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
