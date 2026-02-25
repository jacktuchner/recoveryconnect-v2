import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { v4 as uuidv4 } from "uuid";
import { sendCallCancelledEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as Record<string, string>).id;
    const body = await req.json();
    const { status } = body;

    const { data: call, error: fetchError } = await supabase
      .from("Call")
      .select("*, guide:User!Call_contributorId_fkey(stripeConnectId, stripeConnectOnboarded)")
      .eq("id", id)
      .single();

    if (fetchError || !call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (call.patientId !== userId && call.contributorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedTransitions: Record<string, string[]> = {
      CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
    };

    if (!allowedTransitions[call.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${call.status} to ${status}` },
        { status: 400 }
      );
    }

    // 24-hour cancellation policy: allow cancellation always, but only refund if >= 24 hours
    let refundIssued = false;
    if (status === "CANCELLED") {
      const hoursUntilCall = (new Date(call.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60);

      if (hoursUntilCall >= 24) {
        // Refund the payment
        const { data: payment } = await supabase
          .from("Payment")
          .select("id, stripePaymentId")
          .eq("type", "CALL_PAYMENT")
          .contains("metadata", { callId: call.id })
          .maybeSingle();

        if (payment?.stripePaymentId) {
          try {
            await stripe.refunds.create({
              payment_intent: payment.stripePaymentId,
            });
            await supabase
              .from("Payment")
              .update({ status: "REFUNDED" })
              .eq("id", payment.id);
            refundIssued = true;
            console.log(`Refund issued for call ${call.id}`);
          } catch (refundError) {
            console.error("Failed to process refund:", refundError);
          }
        }
      }
      // < 24 hours: no refund, but cancellation still proceeds
    }

    const videoRoomUrl = call.videoRoomUrl;

    const { data: updated, error } = await supabase
      .from("Call")
      .update({
        status,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, seeker:User!Call_patientId_fkey(*), guide:User!Call_contributorId_fkey(*, profile:Profile(*))")
      .single();

    if (error) throw error;

    // Send email notifications based on status change
    const isGuide = userId === call.contributorId;

    if (status === "CANCELLED") {
      // Send cancellation email to BOTH parties
      const guide = updated.guide;
      const seeker = updated.seeker;

      if (seeker?.email) {
        sendCallCancelledEmail(
          seeker.email,
          seeker.name || "Seeker",
          isGuide ? (guide?.name || "Your guide") : "You",
          new Date(updated.scheduledAt),
          isGuide,
          refundIssued
        ).catch((err) => console.error("Failed to send cancellation email to seeker:", err));
      }

      if (guide?.email) {
        sendCallCancelledEmail(
          guide.email,
          guide.name || "Guide",
          isGuide ? "You" : (seeker?.name || "The seeker"),
          new Date(updated.scheduledAt),
          isGuide,
          refundIssued
        ).catch((err) => console.error("Failed to send cancellation email to guide:", err));
      }
    }

    // If call is completed and guide has Stripe Connect, create payout
    if (status === "COMPLETED" && call.guide?.stripeConnectId && call.guide?.stripeConnectOnboarded) {
      try {
        // Create a transfer to the guide's Connect account
        const transfer = await stripe.transfers.create({
          amount: Math.round(call.contributorPayout * 100), // Convert to cents
          currency: "usd",
          destination: call.guide.stripeConnectId,
          metadata: {
            callId: call.id,
            contributorId: call.contributorId,
            patientId: call.patientId,
          },
        });

        // Record the payout
        await supabase.from("Payment").insert({
          id: uuidv4(),
          userId: call.contributorId,
          type: "GUIDE_PAYOUT",
          amount: call.contributorPayout,
          currency: "usd",
          status: "COMPLETED",
          stripePaymentId: transfer.id,
          metadata: { callId: call.id, transferId: transfer.id },
          createdAt: new Date().toISOString(),
        });

        console.log(`Payout created for call ${call.id}: $${call.contributorPayout}`);
      } catch (payoutError) {
        // Log but don't fail the call update
        console.error("Error creating payout:", payoutError);
      }
    }

    return NextResponse.json({ ...updated, refundIssued });
  } catch (error) {
    console.error("Error updating call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
