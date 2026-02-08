import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    // Verify the checkout session belongs to this user
    if (checkoutSession.metadata?.userId !== userId) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
    }

    if (checkoutSession.status !== "complete") {
      return NextResponse.json({ error: "Checkout not completed" }, { status: 400 });
    }

    // Check if already processed
    const { data: user } = await supabase
      .from("User")
      .select("subscriptionStatus, stripeSubscriptionId")
      .eq("id", userId)
      .single();

    if (user?.subscriptionStatus === "active") {
      return NextResponse.json({ status: "already_active" });
    }

    // Get subscription details
    const subscription = checkoutSession.subscription as import("stripe").Stripe.Subscription | null;
    if (!subscription) {
      return NextResponse.json({ error: "No subscription found" }, { status: 400 });
    }

    const plan = checkoutSession.metadata?.plan || "monthly";
    const periodEndTimestamp = subscription.items.data[0]?.current_period_end;
    const periodEnd = periodEndTimestamp
      ? new Date(periodEndTimestamp * 1000).toISOString()
      : null;

    // Update user with subscription info
    const { error: updateError } = await supabase
      .from("User")
      .update({
        subscriptionStatus: subscription.status,
        subscriptionPlan: plan,
        stripeSubscriptionId: subscription.id,
        subscriptionCurrentPeriodEnd: periodEnd,
        subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 });
    }

    // Create payment record
    const amount = subscription.items.data[0]?.price?.unit_amount
      ? subscription.items.data[0].price.unit_amount / 100
      : 0;

    const invoiceId = typeof subscription.latest_invoice === "string"
      ? subscription.latest_invoice
      : subscription.latest_invoice?.id || null;

    await supabase.from("Payment").insert({
      id: uuidv4(),
      userId,
      type: "SUBSCRIPTION",
      amount,
      currency: "usd",
      status: "COMPLETED",
      stripePaymentId: invoiceId,
      metadata: { subscriptionId: subscription.id, plan, description: `${plan === "annual" ? "Annual" : "Monthly"} Subscription` },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ status: "activated", plan });
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
