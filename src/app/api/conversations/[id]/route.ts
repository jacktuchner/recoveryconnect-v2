import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET /api/conversations/[id] — get messages for a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const { id: conversationId } = await params;

    // Verify user is a participant
    const { data: conversation, error: convError } = await supabase
      .from("Conversation")
      .select(`
        id,
        participant1Id,
        participant2Id,
        participant1:User!Conversation_participant1Id_fkey(id, name, image, showRealName, displayName),
        participant2:User!Conversation_participant2Id_fkey(id, name, image, showRealName, displayName)
      `)
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (
      conversation.participant1Id !== userId &&
      conversation.participant2Id !== userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from("Message")
      .select("id, conversationId, senderId, content, isRead, createdAt")
      .eq("conversationId", conversationId)
      .order("createdAt", { ascending: true });

    if (msgError) throw msgError;

    // Mark unread messages from the other person as read
    await supabase
      .from("Message")
      .update({ isRead: true })
      .eq("conversationId", conversationId)
      .neq("senderId", userId)
      .eq("isRead", false);

    // Determine other participant with privacy
    const isP1 = conversation.participant1Id === userId;
    const other: any = isP1 ? conversation.participant2 : conversation.participant1;
    const otherName = other?.showRealName
      ? other.name
      : (other?.displayName || "Anonymous");
    const otherImage = other?.showRealName ? other.image : null;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherParticipant: {
          id: other?.id,
          name: otherName,
          image: otherImage,
        },
      },
      messages: messages || [],
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
