import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { sendNewMessageEmail } from "@/lib/email";

// POST /api/messages — send a message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const { conversationId, content } = await req.json();

    if (!conversationId || !content?.trim()) {
      return NextResponse.json(
        { error: "conversationId and content are required" },
        { status: 400 }
      );
    }

    // Verify user is a participant
    const { data: conversation } = await supabase
      .from("Conversation")
      .select("id, participant1Id, participant2Id, lastMessageAt")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
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

    const now = new Date().toISOString();

    // Insert message
    const { data: message, error: msgError } = await supabase
      .from("Message")
      .insert({
        id: uuidv4(),
        conversationId,
        senderId: userId,
        content: content.trim(),
        isRead: false,
        createdAt: now,
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Update conversation lastMessageAt
    await supabase
      .from("Conversation")
      .update({ lastMessageAt: now })
      .eq("id", conversationId);

    // Send email notification (throttled — skip if last message was <10 min ago)
    const lastMessageTime = new Date(conversation.lastMessageAt).getTime();
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    if (lastMessageTime < tenMinutesAgo) {
      const recipientId =
        conversation.participant1Id === userId
          ? conversation.participant2Id
          : conversation.participant1Id;

      const { data: recipient } = await supabase
        .from("User")
        .select("email, name, showRealName, displayName")
        .eq("id", recipientId)
        .single();

      const { data: sender } = await supabase
        .from("User")
        .select("name, showRealName, displayName")
        .eq("id", userId)
        .single();

      if (recipient?.email) {
        const senderName = sender?.showRealName
          ? sender.name
          : (sender?.displayName || "Someone");

        const recipientName = recipient.showRealName
          ? recipient.name
          : (recipient.displayName || "there");

        sendNewMessageEmail(
          recipient.email,
          recipientName || "there",
          senderName || "Someone",
          content.trim(),
          conversationId
        ).catch((err) =>
          console.error("Failed to send message notification:", err)
        );
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
