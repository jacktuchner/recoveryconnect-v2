import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

// GET - Get Connect account status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    const { data: user, error } = await supabase
      .from("User")
      .select("stripeConnectId, stripeConnectOnboarded")
      .eq("id", userId)
      .single();

    if (error) throw error;

    if (!user?.stripeConnectId) {
      return NextResponse.json({
        connected: false,
        onboarded: false,
      });
    }

    // Check account status from Stripe
    const account = await stripe.accounts.retrieve(user.stripeConnectId);

    const isOnboarded =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled;

    // Update onboarded status if it changed
    if (isOnboarded !== user.stripeConnectOnboarded) {
      await supabase
        .from("User")
        .update({ stripeConnectOnboarded: isOnboarded })
        .eq("id", userId);
    }

    return NextResponse.json({
      connected: true,
      onboarded: isOnboarded,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (error: any) {
    console.error("Error getting Connect status:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error", details: error?.type || error?.code },
      { status: 500 }
    );
  }
}

// POST - Create Connect account and onboarding link
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const userEmail = session.user.email;

    const { data: user, error } = await supabase
      .from("User")
      .select("stripeConnectId, name")
      .eq("id", userId)
      .single();

    if (error) throw error;

    let stripeConnectId = user?.stripeConnectId;

    // Create Connect account if doesn't exist
    if (!stripeConnectId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: userEmail || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          userId,
        },
      });

      stripeConnectId = account.id;

      // Save Connect ID to user
      await supabase
        .from("User")
        .update({ stripeConnectId })
        .eq("id", userId);
    }

    // Create account link for onboarding
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: stripeConnectId,
      refresh_url: `${baseUrl}/dashboard/contributor?connect_refresh=true`,
      return_url: `${baseUrl}/dashboard/contributor?connect_complete=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Error creating Connect account:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error", details: error?.type || error?.code },
      { status: 500 }
    );
  }
}
