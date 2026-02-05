import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const body = await req.json();
    const { seriesId } = body;

    if (!seriesId) {
      return NextResponse.json(
        { error: "Series ID is required" },
        { status: 400 }
      );
    }

    // Get the series with recordings
    const { data: series, error: seriesError } = await supabase
      .from("RecordingSeries")
      .select(
        `*,
        contributor:User!RecordingSeries_contributorId_fkey(id, name),
        recordings:SeriesRecording(
          recording:Recording(id, title, price, status)
        )`
      )
      .eq("id", seriesId)
      .eq("status", "PUBLISHED")
      .single();

    if (seriesError || !series) {
      return NextResponse.json(
        { error: "Series not found" },
        { status: 404 }
      );
    }

    // Filter to only published recordings
    const publishedRecordings = (series.recordings || [])
      .map((sr: any) => sr.recording)
      .filter((r: any) => r && r.status === "PUBLISHED");

    if (publishedRecordings.length === 0) {
      return NextResponse.json(
        { error: "This series has no available recordings" },
        { status: 400 }
      );
    }

    // Check if user already has access
    const { data: existingAccess } = await supabase
      .from("SeriesAccess")
      .select("id")
      .eq("userId", userId)
      .eq("seriesId", seriesId)
      .single();

    if (existingAccess) {
      return NextResponse.json(
        { error: "You already have access to this series" },
        { status: 400 }
      );
    }

    // Check if user is the contributor
    if (series.contributorId === userId) {
      return NextResponse.json(
        { error: "You own this series" },
        { status: 400 }
      );
    }

    // Calculate price with discount
    const totalValue = publishedRecordings.reduce((sum: number, r: any) => sum + (r.price || 0), 0);
    const discountedPrice = totalValue * (1 - series.discountPercent / 100);
    const savingsAmount = totalValue - discountedPrice;

    // Create Stripe Checkout session
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: series.title,
              description: `${publishedRecordings.length} recordings by ${series.contributor?.name || "Anonymous"} (${series.discountPercent}% bundle discount - Save $${savingsAmount.toFixed(2)})`,
              metadata: {
                seriesId: series.id,
              },
            },
            unit_amount: Math.round(discountedPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "series_purchase",
        userId,
        seriesId,
        recordingIds: publishedRecordings.map((r: any) => r.id).join(","),
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/series/${seriesId}`,
      customer_email: session.user.email || undefined,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating series checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
