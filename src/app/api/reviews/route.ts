import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const authorId = searchParams.get("authorId");
    const subjectId = searchParams.get("subjectId");
    const recordingId = searchParams.get("recordingId");
    const callId = searchParams.get("callId");

    let query = supabase
      .from("Review")
      .select("*, author:User!Review_authorId_fkey(id, name, image, showRealName, displayName), subject:User!Review_subjectId_fkey(id, name)")
      .order("createdAt", { ascending: false });

    if (authorId) query = query.eq("authorId", authorId);
    if (subjectId) query = query.eq("subjectId", subjectId);
    if (recordingId) query = query.eq("recordingId", recordingId);
    if (callId) query = query.eq("callId", callId);

    const { data: reviews, error } = await query;

    if (error) throw error;

    // Apply privacy: use displayName when showRealName is false
    const privacyApplied = (reviews || []).map((r: any) => ({
      ...r,
      author: r.author
        ? {
            id: r.author.id,
            name: r.author.showRealName ? r.author.name : (r.author.displayName || "Anonymous"),
            image: r.author.showRealName ? r.author.image : null,
          }
        : null,
    }));

    return NextResponse.json(privacyApplied);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const body = await req.json();
    const {
      subjectId,
      recordingId,
      callId,
      rating,
      matchRelevance,
      helpfulness,
      comment,
    } = body;

    if (!subjectId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Subject ID and valid rating (1-5) are required" },
        { status: 400 }
      );
    }

    // Duplicate review prevention
    if (callId) {
      const { data: existing } = await supabase
        .from("Review")
        .select("id")
        .eq("authorId", userId)
        .eq("callId", callId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: "You have already reviewed this call" },
          { status: 409 }
        );
      }
    }

    if (recordingId) {
      const { data: existing } = await supabase
        .from("Review")
        .select("id")
        .eq("authorId", userId)
        .eq("recordingId", recordingId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: "You have already reviewed this recording" },
          { status: 409 }
        );
      }
    }

    const { data: review, error } = await supabase
      .from("Review")
      .insert({
        id: uuidv4(),
        authorId: userId,
        subjectId,
        recordingId,
        callId,
        rating,
        matchRelevance,
        helpfulness,
        comment,
        createdAt: new Date().toISOString(),
      })
      .select("*, author:User!Review_authorId_fkey(*)")
      .single();

    if (error) throw error;

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
