import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { FORUM_PAGE_SIZE } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const procedure = searchParams.get("procedure");
    const threadType = searchParams.get("type");
    const sort = searchParams.get("sort") || "active";
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");

    let query = supabase
      .from("ForumThread")
      .select(
        "*, author:User!ForumThread_authorId_fkey(id, name, image, role)",
        { count: "exact" }
      );

    if (procedure) {
      query = query.eq("procedureType", procedure);
    }
    if (threadType) {
      query = query.eq("threadType", threadType);
    }
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // Pinned threads always first
    query = query.order("isPinned", { ascending: false });

    if (sort === "newest") {
      query = query.order("createdAt", { ascending: false });
    } else if (sort === "most_replies") {
      query = query.order("replyCount", { ascending: false });
    } else {
      // active (default) — most recently replied to
      query = query.order("lastReplyAt", { ascending: false, nullsFirst: false });
      query = query.order("createdAt", { ascending: false });
    }

    const offset = (page - 1) * FORUM_PAGE_SIZE;
    query = query.range(offset, offset + FORUM_PAGE_SIZE - 1);

    const { data: threads, error, count } = await query;

    if (error) throw error;

    const total = count || 0;

    return NextResponse.json({
      threads: threads || [],
      pagination: {
        page,
        total,
        totalPages: Math.ceil(total / FORUM_PAGE_SIZE),
      },
    });
  } catch (error) {
    console.error("Error fetching forum threads:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    const { title, content, procedureType, threadType } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    if (!procedureType) {
      return NextResponse.json({ error: "Procedure type is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = uuidv4();

    const { error: createError } = await supabase
      .from("ForumThread")
      .insert({
        id,
        authorId: userId,
        title: title.trim(),
        content: content.trim(),
        procedureType,
        threadType: threadType || "DISCUSSION",
        isPinned: false,
        replyCount: 0,
        lastReplyAt: null,
        createdAt: now,
        updatedAt: now,
      });

    if (createError) throw createError;

    const { data: created } = await supabase
      .from("ForumThread")
      .select("*, author:User!ForumThread_authorId_fkey(id, name, image, role)")
      .eq("id", id)
      .single();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating forum thread:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
