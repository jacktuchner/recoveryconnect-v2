import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

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

    const { data: thread, error } = await supabase
      .from("ForumThread")
      .select("*, author:User!ForumThread_authorId_fkey(id, name, image, role)")
      .eq("id", id)
      .single();

    if (error || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Fetch first page of replies
    const { data: replies } = await supabase
      .from("ForumReply")
      .select("*, author:User!ForumReply_authorId_fkey(id, name, image, role)")
      .eq("threadId", id)
      .order("createdAt", { ascending: true })
      .range(0, 24);

    return NextResponse.json({
      thread,
      replies: replies || [],
    });
  } catch (error) {
    console.error("Error fetching forum thread:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const userRole = (session.user as any)?.role;
    const { id } = await params;

    // Fetch thread to check ownership
    const { data: thread } = await supabase
      .from("ForumThread")
      .select("authorId")
      .eq("id", id)
      .single();

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.authorId !== userId && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("ForumThread")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting forum thread:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
