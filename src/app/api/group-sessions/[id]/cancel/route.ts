import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { GROUP_SESSION_CANCEL_HOURS_BEFORE } from "@/lib/constants";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    // Get the group session
    const { data: groupSession, error: sessionError } = await supabase
      .from("GroupSession")
      .select("id, scheduledAt, title, status")
      .eq("id", id)
      .single();

    if (sessionError || !groupSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if within cancellation window
    const hoursUntilSession = (new Date(groupSession.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilSession < GROUP_SESSION_CANCEL_HOURS_BEFORE) {
      return NextResponse.json(
        { error: `Cannot cancel within ${GROUP_SESSION_CANCEL_HOURS_BEFORE} hours of the session` },
        { status: 400 }
      );
    }

    // Get participant record
    const { data: participant, error: partError } = await supabase
      .from("GroupSessionParticipant")
      .select("id, pricePaid, paymentId, stripeSessionId, status")
      .eq("groupSessionId", id)
      .eq("userId", userId)
      .eq("status", "REGISTERED")
      .single();

    if (partError || !participant) {
      return NextResponse.json({ error: "You are not registered for this session" }, { status: 400 });
    }

    // Process refund if paid
    if (participant.pricePaid > 0 && participant.stripeSessionId) {
      try {
        const checkoutSession = await stripe.checkout.sessions.retrieve(participant.stripeSessionId);
        if (checkoutSession.payment_intent) {
          await stripe.refunds.create({
            payment_intent: checkoutSession.payment_intent as string,
          });
        }

        // Update payment record to REFUNDED
        if (participant.paymentId) {
          await supabase
            .from("Payment")
            .update({ status: "REFUNDED" })
            .eq("id", participant.paymentId);
        }
      } catch (refundError) {
        console.error("Error processing refund:", refundError);
        return NextResponse.json({ error: "Failed to process refund" }, { status: 500 });
      }
    }

    // Update participant status
    const newStatus = participant.pricePaid > 0 ? "REFUNDED" : "CANCELLED";
    const { error: updateError } = await supabase
      .from("GroupSessionParticipant")
      .update({ status: newStatus })
      .eq("id", participant.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Error cancelling group session registration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
