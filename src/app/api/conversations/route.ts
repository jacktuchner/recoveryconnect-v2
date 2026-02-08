import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

// GET /api/conversations — list user's conversations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    // Get conversations where user is either participant
    const { data: conversations, error } = await supabase
      .from("Conversation")
      .select(`
        id,
        participant1Id,
        participant2Id,
        lastMessageAt,
        createdAt,
        participant1:User!Conversation_participant1Id_fkey(id, name, image, showRealName, displayName),
        participant2:User!Conversation_participant2Id_fkey(id, name, image, showRealName, displayName)
      `)
      .or(`participant1Id.eq.${userId},participant2Id.eq.${userId}`)
      .order("lastMessageAt", { ascending: false });

    if (error) throw error;

    // For each conversation, get last message and unread count
    const enriched = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        // Get last message
        const { data: lastMessages } = await supabase
          .from("Message")
          .select("content, senderId, createdAt")
          .eq("conversationId", conv.id)
          .order("createdAt", { ascending: false })
          .limit(1);

        // Get unread count
        const { count: unreadCount } = await supabase
          .from("Message")
          .select("id", { count: "exact", head: true })
          .eq("conversationId", conv.id)
          .neq("senderId", userId)
          .eq("isRead", false);

        // Determine who the other participant is
        const isP1 = conv.participant1Id === userId;
        const other = isP1 ? conv.participant2 : conv.participant1;

        // Apply privacy
        const otherName = other?.showRealName
          ? other.name
          : (other?.displayName || "Anonymous");
        const otherImage = other?.showRealName ? other.image : null;

        return {
          id: conv.id,
          otherParticipant: {
            id: other?.id,
            name: otherName,
            image: otherImage,
          },
          lastMessage: lastMessages?.[0] || null,
          unreadCount: unreadCount || 0,
          lastMessageAt: conv.lastMessageAt,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/conversations — create or find existing conversation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const { participantId } = await req.json();

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId is required" },
        { status: 400 }
      );
    }

    if (participantId === userId) {
      return NextResponse.json(
        { error: "Cannot message yourself" },
        { status: 400 }
      );
    }

    // Check subscriber status for patients
    const { data: currentUser } = await supabase
      .from("User")
      .select("role, subscriptionStatus")
      .eq("id", userId)
      .single();

    if (
      currentUser &&
      (currentUser.role === "PATIENT") &&
      currentUser.subscriptionStatus !== "active" &&
      currentUser.subscriptionStatus !== "trialing"
    ) {
      return NextResponse.json(
        { error: "Messaging requires an active subscription" },
        { status: 403 }
      );
    }

    // Check if conversation already exists (either direction)
    const { data: existing } = await supabase
      .from("Conversation")
      .select("id")
      .or(
        `and(participant1Id.eq.${userId},participant2Id.eq.${participantId}),and(participant1Id.eq.${participantId},participant2Id.eq.${userId})`
      )
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ conversationId: existing.id });
    }

    // Create new conversation
    const newId = uuidv4();
    const { error } = await supabase.from("Conversation").insert({
      id: newId,
      participant1Id: userId,
      participant2Id: participantId,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ conversationId: newId }, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
