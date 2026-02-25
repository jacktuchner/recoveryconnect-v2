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

    if (userRole !== "GUIDE" && userRole !== "BOTH" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Only guides can endorse recommendations" }, { status: 403 });
    }

    // Verify recommendation exists
    const { data: rec } = await supabase
      .from("Recommendation")
      .select("id, endorsementCount")
      .eq("id", id)
      .eq("status", "ACTIVE")
      .single();

    if (!rec) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    // Check for existing endorsement
    const { data: existing } = await supabase
      .from("RecommendationEndorsement")
      .select("id")
      .eq("recommendationId", id)
      .eq("contributorId", userId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "You have already endorsed this recommendation" }, { status: 409 });
    }

    const body = await req.json();
    const now = new Date().toISOString();

    const { error: endorseError } = await supabase
      .from("RecommendationEndorsement")
      .insert({
        id: uuidv4(),
        recommendationId: id,
        contributorId: userId,
        comment: body.comment?.trim() || null,
        recoveryPhase: body.recoveryPhase || null,
        source: "MANUAL",
        createdAt: now,
        updatedAt: now,
      });

    if (endorseError) throw endorseError;

    const { error: updateError } = await supabase
      .from("Recommendation")
      .update({
        endorsementCount: (rec.endorsementCount || 0) + 1,
        updatedAt: now,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ endorsed: true });
  } catch (error) {
    console.error("Error endorsing recommendation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Find the endorsement
    const { data: endorsement } = await supabase
      .from("RecommendationEndorsement")
      .select("id")
      .eq("recommendationId", id)
      .eq("contributorId", userId)
      .single();

    if (!endorsement) {
      return NextResponse.json({ error: "Endorsement not found" }, { status: 404 });
    }

    // Delete the endorsement
    const { error: deleteError } = await supabase
      .from("RecommendationEndorsement")
      .delete()
      .eq("id", endorsement.id);

    if (deleteError) throw deleteError;

    // Decrement endorsement count
    const { data: rec } = await supabase
      .from("Recommendation")
      .select("endorsementCount")
      .eq("id", id)
      .single();

    if (rec) {
      await supabase
        .from("Recommendation")
        .update({
          endorsementCount: Math.max(0, (rec.endorsementCount || 1) - 1),
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id);
    }

    return NextResponse.json({ endorsed: false });
  } catch (error) {
    console.error("Error removing endorsement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
