import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { v4 as uuidv4 } from "uuid";
import { sendCallConfirmedEmail, sendCallCancelledEmail } from "@/lib/email";
import { createRoom } from "@/lib/daily";

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
      .select("*, contributor:User!Call_contributorId_fkey(stripeConnectId, stripeConnectOnboarded)")
      .eq("id", id)
      .single();

    if (fetchError || !call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (call.patientId !== userId && call.contributorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedTransitions: Record<string, string[]> = {
      REQUESTED: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
    };

    if (!allowedTransitions[call.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${call.status} to ${status}` },
        { status: 400 }
      );
    }

    // If confirming the call, create a Daily.co video room
    let videoRoomUrl = call.videoRoomUrl;
    if (status === "CONFIRMED" && !videoRoomUrl) {
      try {
        // Calculate minutes until call + buffer (2 hours after scheduled time)
        const scheduledAt = new Date(call.scheduledAt);
        const expiresAt = new Date(scheduledAt.getTime() + (call.durationMinutes + 120) * 60 * 1000);
        const minutesUntilExpiry = Math.max(60, Math.ceil((expiresAt.getTime() - Date.now()) / 60000));

        videoRoomUrl = await createRoom({
          callId: call.id,
          expiresInMinutes: minutesUntilExpiry,
          enableChat: true,
          enableScreenshare: true,
        });
        console.log(`Created video room for call ${call.id}: ${videoRoomUrl}`);
      } catch (roomError) {
        console.error("Failed to create video room:", roomError);
        // Don't fail the confirmation if room creation fails
        // The room can be created later or manually
      }
    }

    const { data: updated, error } = await supabase
      .from("Call")
      .update({
        status,
        videoRoomUrl: videoRoomUrl || call.videoRoomUrl,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, patient:User!Call_patientId_fkey(*), contributor:User!Call_contributorId_fkey(*, profile:Profile(*))")
      .single();

    if (error) throw error;

    // Send email notifications based on status change
    const isContributor = userId === call.contributorId;

    if (status === "CONFIRMED" && updated.patient?.email) {
      // Notify patient that call is confirmed (includes video link)
      sendCallConfirmedEmailWithRoom(
        updated.patient.email,
        updated.patient.name || "Patient",
        updated.contributor?.name || "Your mentor",
        new Date(updated.scheduledAt),
        updated.durationMinutes,
        updated.videoRoomUrl
      ).catch((err) => console.error("Failed to send call confirmed email:", err));

      // Also notify contributor with the video link
      if (updated.contributor?.email) {
        sendCallConfirmedEmailWithRoom(
          updated.contributor.email,
          updated.contributor.name || "Contributor",
          updated.patient?.name || "Patient",
          new Date(updated.scheduledAt),
          updated.durationMinutes,
          updated.videoRoomUrl,
          true // isContributor
        ).catch((err) => console.error("Failed to send contributor confirmation email:", err));
      }
    }

    if (status === "CANCELLED") {
      // Notify the other party that call was cancelled
      const recipient = isContributor ? updated.patient : updated.contributor;
      const cancelledBy = isContributor ? updated.contributor : updated.patient;

      if (recipient?.email) {
        sendCallCancelledEmail(
          recipient.email,
          recipient.name || "User",
          cancelledBy?.name || "The other party",
          new Date(updated.scheduledAt),
          isContributor // wasContributorCancelling
        ).catch((err) => console.error("Failed to send call cancelled email:", err));
      }
    }

    // If call is completed and contributor has Stripe Connect, create payout
    if (status === "COMPLETED" && call.contributor?.stripeConnectId && call.contributor?.stripeConnectOnboarded) {
      try {
        // Create a transfer to the contributor's Connect account
        const transfer = await stripe.transfers.create({
          amount: Math.round(call.contributorPayout * 100), // Convert to cents
          currency: "usd",
          destination: call.contributor.stripeConnectId,
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
          type: "CONTRIBUTOR_PAYOUT",
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to send confirmation email with video room link
async function sendCallConfirmedEmailWithRoom(
  email: string,
  recipientName: string,
  otherPartyName: string,
  scheduledAt: Date,
  durationMinutes: number,
  videoRoomUrl: string | null,
  isContributor: boolean = false
) {
  // If no video room URL, fall back to the regular confirmation email
  if (!videoRoomUrl) {
    return sendCallConfirmedEmail(email, recipientName, otherPartyName, scheduledAt, durationMinutes);
  }

  // Import Resend dynamically to avoid circular imports
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM_EMAIL = process.env.EMAIL_FROM || "RecoveryConnect <onboarding@resend.dev>";

  const dateStr = scheduledAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = scheduledAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; background: #0d9488; color: white; font-weight: bold; padding: 10px 15px; border-radius: 8px; font-size: 18px;">
      Recovery<span style="color: #a5f3fc;">Connect</span>
    </div>
  </div>

  <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">Your Call is Confirmed!</h1>
  <p>Hi ${recipientName},</p>
  <p>${isContributor ? `<strong>${otherPartyName}</strong> has booked a call with you.` : `Great news! <strong>${otherPartyName}</strong> has confirmed your call.`}</p>

  <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${dateStr}</p>
    <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${timeStr}</p>
    <p style="margin: 0;"><strong>Duration:</strong> ${durationMinutes} minutes</p>
  </div>

  <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
    <p style="margin: 0 0 15px 0; font-weight: 600; color: #059669;">Join your video call here:</p>
    <a href="${videoRoomUrl}"
       style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Join Video Call
    </a>
    <p style="margin: 15px 0 0 0; font-size: 12px; color: #6b7280;">
      This link will be active starting 15 minutes before your scheduled time.
    </p>
  </div>

  <p><strong>Tips for your call:</strong></p>
  <ul style="padding-left: 20px; color: #6b7280;">
    <li>Find a quiet, private space</li>
    <li>Test your camera and microphone beforehand</li>
    <li>Have a stable internet connection</li>
    ${isContributor ? "<li>Review any questions submitted in advance</li>" : "<li>Have your questions ready</li>"}
    <li>Remember: this is peer support, not medical advice</li>
  </ul>

  <p>We'll send you a reminder before your call.</p>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
    <p>RecoveryConnect - Peer support for your recovery journey</p>
  </div>
</body>
</html>
  `.trim();

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Call confirmed with ${otherPartyName} - Video link inside`,
      html: content,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send confirmation email with video link:", error);
    return { success: false, error };
  }
}
