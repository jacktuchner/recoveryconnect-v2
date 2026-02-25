import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { sendGroupSessionSignupEmail } from "@/lib/email";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const { groupSessionId } = await req.json();

    if (!groupSessionId) {
      return NextResponse.json({ error: "Group session ID is required" }, { status: 400 });
    }

    // Fetch the group session
    const { data: groupSession, error: sessionError } = await supabase
      .from("GroupSession")
      .select("*")
      .eq("id", groupSessionId)
      .single();

    if (sessionError || !groupSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (groupSession.status !== "SCHEDULED" && groupSession.status !== "CONFIRMED") {
      return NextResponse.json({ error: "This session is no longer accepting registrations" }, { status: 400 });
    }

    if (new Date(groupSession.scheduledAt) <= new Date()) {
      return NextResponse.json({ error: "This session has already started" }, { status: 400 });
    }

    // Check if user is the guide (can't join own session)
    if (groupSession.contributorId === userId) {
      return NextResponse.json({ error: "You cannot join your own session" }, { status: 400 });
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from("GroupSessionParticipant")
      .select("id, status")
      .eq("groupSessionId", groupSessionId)
      .eq("userId", userId)
      .in("status", ["REGISTERED", "ATTENDED"])
      .single();

    if (existing) {
      return NextResponse.json({ error: "You are already registered for this session" }, { status: 400 });
    }

    // Check capacity
    const { count } = await supabase
      .from("GroupSessionParticipant")
      .select("id", { count: "exact", head: true })
      .eq("groupSessionId", groupSessionId)
      .eq("status", "REGISTERED");

    if ((count || 0) >= groupSession.maxCapacity) {
      return NextResponse.json({ error: "This session is full" }, { status: 400 });
    }

    // Create Stripe checkout session
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: session.user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: groupSession.title,
              description: `Group session: ${groupSession.procedureType}`,
            },
            unit_amount: Math.round(groupSession.pricePerPerson * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "group_session_payment",
        userId,
        groupSessionId,
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&type=group_session&groupSessionId=${groupSessionId}`,
      cancel_url: `${baseUrl}/group-sessions/${groupSessionId}`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating group session checkout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
