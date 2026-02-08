import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const isContributor = userRole === "CONTRIBUTOR" || userRole === "BOTH" || userRole === "ADMIN";
    const isSubscriber = (session?.user as any)?.subscriptionStatus === "active";

    if (!isContributor && !isSubscriber) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }

    const { data: comments, error } = await supabase
      .from("RecommendationComment")
      .select("id, content, createdAt, user:User!RecommendationComment_userId_fkey(id, name, image)")
      .eq("recommendationId", id)
      .order("createdAt", { ascending: true });

    if (error) throw error;

    return NextResponse.json(comments || []);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const isContributor = userRole === "CONTRIBUTOR" || userRole === "BOTH" || userRole === "ADMIN";
    const isSubscriber = (session.user as any).subscriptionStatus === "active";

    if (!isContributor && !isSubscriber) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }

    const body = await req.json();
    const content = body.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: "Comment must be under 1000 characters" }, { status: 400 });
    }

    // Verify recommendation exists
    const { data: rec } = await supabase
      .from("Recommendation")
      .select("id")
      .eq("id", id)
      .eq("status", "ACTIVE")
      .single();

    if (!rec) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    const commentId = uuidv4();
    const now = new Date().toISOString();

    const { error: insertError } = await supabase
      .from("RecommendationComment")
      .insert({
        id: commentId,
        recommendationId: id,
        userId,
        content,
        createdAt: now,
      });

    if (insertError) throw insertError;

    // Return the created comment with user info
    const { data: created } = await supabase
      .from("RecommendationComment")
      .select("id, content, createdAt, user:User!RecommendationComment_userId_fkey(id, name, image)")
      .eq("id", commentId)
      .single();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
