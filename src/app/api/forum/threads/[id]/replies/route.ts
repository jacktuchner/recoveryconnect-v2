import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

const REPLIES_PAGE_SIZE = 25;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");

    const offset = (page - 1) * REPLIES_PAGE_SIZE;

    const { data: replies, error, count } = await supabase
      .from("ForumReply")
      .select(
        "*, author:User!ForumReply_authorId_fkey(id, name, image, role)",
        { count: "exact" }
      )
      .eq("threadId", id)
      .order("createdAt", { ascending: true })
      .range(offset, offset + REPLIES_PAGE_SIZE - 1);

    if (error) throw error;

    const total = count || 0;

    return NextResponse.json({
      replies: replies || [],
      pagination: {
        page,
        total,
        totalPages: Math.ceil(total / REPLIES_PAGE_SIZE),
      },
    });
  } catch (error) {
    console.error("Error fetching forum replies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const { id: threadId } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Verify thread exists
    const { data: thread } = await supabase
      .from("ForumThread")
      .select("id, replyCount")
      .eq("id", threadId)
      .single();

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const replyId = uuidv4();

    const { error: createError } = await supabase
      .from("ForumReply")
      .insert({
        id: replyId,
        threadId,
        authorId: userId,
        content: content.trim(),
        createdAt: now,
        updatedAt: now,
      });

    if (createError) throw createError;

    // Update thread replyCount and lastReplyAt
    const { error: updateError } = await supabase
      .from("ForumThread")
      .update({
        replyCount: (thread.replyCount || 0) + 1,
        lastReplyAt: now,
        updatedAt: now,
      })
      .eq("id", threadId);

    if (updateError) throw updateError;

    const { data: created } = await supabase
      .from("ForumReply")
      .select("*, author:User!ForumReply_authorId_fkey(id, name, image, role)")
      .eq("id", replyId)
      .single();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating forum reply:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
