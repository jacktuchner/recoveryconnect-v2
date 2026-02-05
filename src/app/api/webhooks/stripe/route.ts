import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "checkout.session.expired":
        console.log("Checkout session expired:", event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { type, userId, recordingId, callId, contributorId, scheduledAt, durationMinutes, questionsInAdvance, seriesId, recordingIds } = session.metadata || {};

  if (type === "recording_purchase" && userId && recordingId) {
    await handleRecordingPurchase(session, userId, recordingId);
  } else if (type === "call_payment" && userId && contributorId) {
    await handleCallPayment(session, userId, contributorId, scheduledAt, durationMinutes, questionsInAdvance);
  } else if (type === "series_purchase" && userId && seriesId) {
    await handleSeriesPurchase(session, userId, seriesId, recordingIds);
  }
}

async function handleRecordingPurchase(
  session: Stripe.Checkout.Session,
  userId: string,
  recordingId: string
) {
  const paymentId = uuidv4();
  const accessId = uuidv4();
  const amount = (session.amount_total || 0) / 100;

  // Fetch recording with contributor info
  const { data: recording, error: recordingError } = await supabase
    .from("Recording")
    .select("*, contributor:User!Recording_contributorId_fkey(id, stripeConnectId, stripeConnectOnboarded)")
    .eq("id", recordingId)
    .single();

  if (recordingError || !recording) {
    console.error("Error fetching recording:", recordingError);
    throw recordingError || new Error("Recording not found");
  }

  // Calculate payout amounts (75% to contributor, 25% platform fee)
  const contributorPayout = amount * 0.75;
  const platformFee = amount * 0.25;

  // Create payment record with payout tracking
  const { error: paymentError } = await supabase.from("Payment").insert({
    id: paymentId,
    userId,
    type: "RECORDING_PURCHASE",
    amount,
    currency: session.currency || "usd",
    status: "COMPLETED",
    stripePaymentId: session.payment_intent as string,
    stripeSessionId: session.id,
    metadata: { recordingId, contributorPayout, platformFee },
    createdAt: new Date().toISOString(),
  });

  if (paymentError) {
    console.error("Error creating payment record:", paymentError);
    throw paymentError;
  }

  // Create recording access
  const { error: accessError } = await supabase.from("RecordingAccess").insert({
    id: accessId,
    userId,
    recordingId,
    paymentId,
    grantedAt: new Date().toISOString(),
  });

  if (accessError) {
    console.error("Error creating recording access:", accessError);
    throw accessError;
  }

  // Transfer payout to contributor if they have Stripe Connect set up
  if (recording.contributor?.stripeConnectId && recording.contributor?.stripeConnectOnboarded) {
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(contributorPayout * 100), // Convert to cents
        currency: "usd",
        destination: recording.contributor.stripeConnectId,
        transfer_group: `recording_${recording.id}`,
        metadata: {
          recordingId: recording.id,
          contributorId: recording.contributor.id,
          buyerId: userId,
        },
      });

      // Record the payout
      await supabase.from("Payment").insert({
        id: uuidv4(),
        userId: recording.contributor.id,
        type: "CONTRIBUTOR_PAYOUT",
        amount: contributorPayout,
        currency: "usd",
        status: "COMPLETED",
        stripePaymentId: transfer.id,
        metadata: { recordingId: recording.id, transferId: transfer.id, purchasePaymentId: paymentId },
        createdAt: new Date().toISOString(),
      });

      console.log(`Payout created for recording ${recording.id}: $${contributorPayout.toFixed(2)}`);
    } catch (payoutError) {
      // Log but don't fail the purchase - the recording access was still granted
      console.error("Error creating recording payout:", payoutError);
    }
  } else {
    console.log(`Skipping payout for recording ${recording.id}: contributor not onboarded to Stripe Connect`);
  }

  console.log(`Recording purchase completed: user ${userId}, recording ${recordingId}`);
}

async function handleCallPayment(
  session: Stripe.Checkout.Session,
  userId: string,
  contributorId: string,
  scheduledAt?: string,
  durationMinutes?: string,
  questionsInAdvance?: string
) {
  if (!scheduledAt) {
    throw new Error("Missing scheduledAt in call payment metadata");
  }

  // Get contributor to calculate pricing
  const { data: contributor, error: contribError } = await supabase
    .from("User")
    .select("*, profile:Profile(*)")
    .eq("id", contributorId)
    .single();

  if (contribError || !contributor?.profile) {
    throw new Error("Contributor not found");
  }

  const rate = contributor.profile.hourlyRate || 50;
  const duration = parseInt(durationMinutes || "30");
  const price = (session.amount_total || 0) / 100;
  const platformFee = price * (PLATFORM_FEE_PERCENT / 100);
  const contributorPayout = price - platformFee;

  const paymentId = uuidv4();
  const callId = uuidv4();

  // Create payment record
  const { error: paymentError } = await supabase.from("Payment").insert({
    id: paymentId,
    userId,
    type: "CALL_PAYMENT",
    amount: price,
    currency: session.currency || "usd",
    status: "COMPLETED",
    stripePaymentId: session.payment_intent as string,
    stripeSessionId: session.id,
    metadata: { contributorId, callId },
    createdAt: new Date().toISOString(),
  });

  if (paymentError) {
    console.error("Error creating payment record:", paymentError);
    throw paymentError;
  }

  // Create call record
  const { error: callError } = await supabase.from("Call").insert({
    id: callId,
    patientId: userId,
    contributorId,
    scheduledAt: new Date(scheduledAt).toISOString(),
    durationMinutes: duration,
    questionsInAdvance: questionsInAdvance || null,
    price,
    platformFee,
    contributorPayout,
    status: "REQUESTED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (callError) {
    console.error("Error creating call record:", callError);
    throw callError;
  }

  console.log(`Call payment completed: patient ${userId}, contributor ${contributorId}`);
}

async function handleSeriesPurchase(
  session: Stripe.Checkout.Session,
  userId: string,
  seriesId: string,
  recordingIds?: string
) {
  const paymentId = uuidv4();
  const amount = (session.amount_total || 0) / 100;

  // Fetch series with contributor info
  const { data: series, error: seriesError } = await supabase
    .from("RecordingSeries")
    .select("*, contributor:User!RecordingSeries_contributorId_fkey(id, stripeConnectId, stripeConnectOnboarded)")
    .eq("id", seriesId)
    .single();

  if (seriesError || !series) {
    console.error("Error fetching series:", seriesError);
    throw seriesError || new Error("Series not found");
  }

  // Calculate payout amounts (75% to contributor, 25% platform fee)
  const contributorPayout = amount * 0.75;
  const platformFee = amount * 0.25;

  // Create payment record
  const { error: paymentError } = await supabase.from("Payment").insert({
    id: paymentId,
    userId,
    type: "RECORDING_PURCHASE", // Use same type for payment tracking
    amount,
    currency: session.currency || "usd",
    status: "COMPLETED",
    stripePaymentId: session.payment_intent as string,
    stripeSessionId: session.id,
    metadata: { seriesId, contributorPayout, platformFee, type: "series_purchase" },
    createdAt: new Date().toISOString(),
  });

  if (paymentError) {
    console.error("Error creating payment record:", paymentError);
    throw paymentError;
  }

  // Create series access
  const seriesAccessId = uuidv4();
  const { error: seriesAccessError } = await supabase.from("SeriesAccess").insert({
    id: seriesAccessId,
    userId,
    seriesId,
    paymentId,
    grantedAt: new Date().toISOString(),
  });

  if (seriesAccessError) {
    console.error("Error creating series access:", seriesAccessError);
    throw seriesAccessError;
  }

  // Create RecordingAccess for ALL recordings in series
  const recordingIdList = recordingIds ? recordingIds.split(",") : [];

  if (recordingIdList.length > 0) {
    const recordingAccessRecords = recordingIdList.map((recordingId: string) => ({
      id: uuidv4(),
      userId,
      recordingId: recordingId.trim(),
      paymentId: null, // Series purchase, not individual
      grantedAt: new Date().toISOString(),
    }));

    // Use upsert to handle any duplicate access gracefully
    for (const accessRecord of recordingAccessRecords) {
      const { error: accessError } = await supabase
        .from("RecordingAccess")
        .upsert(accessRecord, { onConflict: "userId,recordingId" });

      if (accessError) {
        console.error(`Error creating recording access for ${accessRecord.recordingId}:`, accessError);
        // Continue with other recordings even if one fails
      }
    }
  }

  // Transfer payout to contributor if they have Stripe Connect set up
  if (series.contributor?.stripeConnectId && series.contributor?.stripeConnectOnboarded) {
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(contributorPayout * 100), // Convert to cents
        currency: "usd",
        destination: series.contributor.stripeConnectId,
        transfer_group: `series_${series.id}`,
        metadata: {
          seriesId: series.id,
          contributorId: series.contributor.id,
          buyerId: userId,
        },
      });

      // Record the payout
      await supabase.from("Payment").insert({
        id: uuidv4(),
        userId: series.contributor.id,
        type: "CONTRIBUTOR_PAYOUT",
        amount: contributorPayout,
        currency: "usd",
        status: "COMPLETED",
        stripePaymentId: transfer.id,
        metadata: { seriesId: series.id, transferId: transfer.id, purchasePaymentId: paymentId },
        createdAt: new Date().toISOString(),
      });

      console.log(`Payout created for series ${series.id}: $${contributorPayout.toFixed(2)}`);
    } catch (payoutError) {
      // Log but don't fail the purchase - the series access was still granted
      console.error("Error creating series payout:", payoutError);
    }
  } else {
    console.log(`Skipping payout for series ${series.id}: contributor not onboarded to Stripe Connect`);
  }

  console.log(`Series purchase completed: user ${userId}, series ${seriesId}, recordings: ${recordingIdList.length}`);
}
