import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const { data: user, error } = await supabase
      .from("User")
      .select("subscriptionStatus, subscriptionPlan, subscriptionCurrentPeriodEnd, subscriptionCancelAtPeriodEnd")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: user.subscriptionStatus || null,
      plan: user.subscriptionPlan || null,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd || null,
      cancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd || false,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
