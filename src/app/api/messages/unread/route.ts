import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET /api/messages/unread — get total unread message count
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    // Get all conversations where user is a participant
    const { data: conversations } = await supabase
      .from("Conversation")
      .select("id")
      .or(`participant1Id.eq.${userId},participant2Id.eq.${userId}`);

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const conversationIds = conversations.map((c: any) => c.id);

    // Count unread messages not sent by user
    const { count } = await supabase
      .from("Message")
      .select("id", { count: "exact", head: true })
      .in("conversationId", conversationIds)
      .neq("senderId", userId)
      .eq("isRead", false);

    return NextResponse.json({ unreadCount: count || 0 });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
