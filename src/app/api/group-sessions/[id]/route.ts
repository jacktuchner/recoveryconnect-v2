import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { sendGroupSessionCancelledEmail } from "@/lib/email";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as Record<string, string>).id : null;

    const { data: groupSession, error } = await supabase
      .from("GroupSession")
      .select("*, guide:User!GroupSession_contributorId_fkey(id, name, image, bio, profile:Profile(procedureTypes, timeSinceSurgery))")
      .eq("id", id)
      .single();

    if (error || !groupSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get participant count
    const { count } = await supabase
      .from("GroupSessionParticipant")
      .select("id", { count: "exact", head: true })
      .eq("groupSessionId", id)
      .eq("status", "REGISTERED");

    // Check if current user is registered
    let isRegistered = false;
    let myParticipation = null;
    if (userId) {
      const { data: participant } = await supabase
        .from("GroupSessionParticipant")
        .select("id, status, pricePaid")
        .eq("groupSessionId", id)
        .eq("userId", userId)
        .in("status", ["REGISTERED", "ATTENDED"])
        .single();

      if (participant) {
        isRegistered = true;
        myParticipation = participant;
      }
    }

    return NextResponse.json({
      ...groupSession,
      participantCount: count || 0,
      isRegistered,
      myParticipation,
    });
  } catch (error) {
    console.error("Error fetching group session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Fetch session
    const { data: groupSession, error: fetchError } = await supabase
      .from("GroupSession")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !groupSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (groupSession.contributorId !== userId) {
      return NextResponse.json({ error: "Only the host can update this session" }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };

    // Get participant count for edit restrictions
    const { count: participantCount } = await supabase
      .from("GroupSessionParticipant")
      .select("id", { count: "exact", head: true })
      .eq("groupSessionId", id)
      .eq("status", "REGISTERED");

    const regCount = participantCount || 0;

    // Allow updating title, description, maxCapacity
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() || null;

    if (body.maxCapacity !== undefined) {
      if (body.maxCapacity < regCount) {
        return NextResponse.json({ error: "Cannot reduce capacity below current participant count" }, { status: 400 });
      }
      updates.maxCapacity = body.maxCapacity;
    }

    // Allow editing date/time and duration only when 0 participants
    if (body.scheduledAt !== undefined && groupSession.status === "SCHEDULED") {
      if (regCount > 0) {
        return NextResponse.json({ error: "Cannot change date/time when participants are signed up" }, { status: 400 });
      }
      const newDate = new Date(body.scheduledAt);
      const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      if (isNaN(newDate.getTime()) || newDate < minDate) {
        return NextResponse.json({ error: "Session must be scheduled at least 24 hours in advance" }, { status: 400 });
      }
      updates.scheduledAt = newDate.toISOString();
    }

    if (body.durationMinutes !== undefined && groupSession.status === "SCHEDULED") {
      if (regCount > 0) {
        return NextResponse.json({ error: "Cannot change duration when participants are signed up" }, { status: 400 });
      }
      const { GROUP_SESSION_DURATIONS } = await import("@/lib/constants");
      if (!GROUP_SESSION_DURATIONS.includes(body.durationMinutes)) {
        return NextResponse.json({ error: `Duration must be one of: ${GROUP_SESSION_DURATIONS.join(", ")} minutes` }, { status: 400 });
      }
      updates.durationMinutes = body.durationMinutes;
    }

    // Cancel session
    if (body.status === "CANCELLED" && groupSession.status === "SCHEDULED") {
      updates.status = "CANCELLED";

      // Refund all paid participants
      const { data: participants } = await supabase
        .from("GroupSessionParticipant")
        .select("*, user:User!GroupSessionParticipant_userId_fkey(email, name)")
        .eq("groupSessionId", id)
        .eq("status", "REGISTERED");

      for (const participant of participants || []) {
        if (participant.pricePaid > 0 && participant.stripeSessionId) {
          try {
            // Find the payment intent from the checkout session
            const checkoutSession = await stripe.checkout.sessions.retrieve(participant.stripeSessionId);
            if (checkoutSession.payment_intent) {
              await stripe.refunds.create({
                payment_intent: checkoutSession.payment_intent as string,
              });
            }

            // Update payment record
            if (participant.paymentId) {
              await supabase
                .from("Payment")
                .update({ status: "REFUNDED" })
                .eq("id", participant.paymentId);
            }
          } catch (refundError) {
            console.error(`Error refunding participant ${participant.userId}:`, refundError);
          }
        }

        // Update participant status
        await supabase
          .from("GroupSessionParticipant")
          .update({ status: participant.pricePaid > 0 ? "REFUNDED" : "CANCELLED" })
          .eq("id", participant.id);

        // Send cancellation email
        if (participant.user?.email) {
          await sendGroupSessionCancelledEmail(
            participant.user.email,
            participant.user.name || "there",
            groupSession.title,
            "Cancelled by host"
          );
        }
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("GroupSession")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating group session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
