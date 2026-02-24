import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; replyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const userRole = (session.user as any)?.role;
    const { id: threadId, replyId } = await params;

    // Fetch reply to check ownership
    const { data: reply } = await supabase
      .from("ForumReply")
      .select("authorId, threadId")
      .eq("id", replyId)
      .single();

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    if (reply.authorId !== userId && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("ForumReply")
      .delete()
      .eq("id", replyId);

    if (error) throw error;

    // Decrement replyCount on thread
    const { data: thread } = await supabase
      .from("ForumThread")
      .select("replyCount")
      .eq("id", threadId)
      .single();

    if (thread) {
      const now = new Date().toISOString();
      await supabase
        .from("ForumThread")
        .update({
          replyCount: Math.max(0, (thread.replyCount || 0) - 1),
          updatedAt: now,
        })
        .eq("id", threadId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting forum reply:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
