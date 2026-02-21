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

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get recording sales
    const { data: recordingPayments } = await supabase
      .from("Payment")
      .select("amount")
      .eq("type", "RECORDING_PURCHASE")
      .eq("status", "COMPLETED");

    const recordingSales = (recordingPayments || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    // Get call payments
    const { data: callPayments } = await supabase
      .from("Payment")
      .select("amount")
      .eq("type", "CALL_PAYMENT")
      .eq("status", "COMPLETED");

    const callPaymentsTotal = (callPayments || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    // Get pending payouts
    const { data: pendingPayouts } = await supabase
      .from("Payment")
      .select("amount")
      .eq("type", "GUIDE_PAYOUT")
      .eq("status", "PENDING");

    const pendingPayoutsTotal = (pendingPayouts || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    // Get completed payouts
    const { data: completedPayouts } = await supabase
      .from("Payment")
      .select("amount")
      .eq("type", "GUIDE_PAYOUT")
      .eq("status", "COMPLETED");

    const completedPayoutsTotal = (completedPayouts || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    return NextResponse.json({
      totalRevenue: recordingSales + callPaymentsTotal,
      recordingSales,
      callPayments: callPaymentsTotal,
      pendingPayouts: pendingPayoutsTotal,
      completedPayouts: completedPayoutsTotal,
    });
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
