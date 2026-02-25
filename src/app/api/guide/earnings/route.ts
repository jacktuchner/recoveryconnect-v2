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

    const userId = (session.user as Record<string, string>).id;

    // Get completed calls with payouts
    const { data: calls, error: callsError } = await supabase
      .from("Call")
      .select("id, contributorPayout, scheduledAt, durationMinutes, status")
      .eq("contributorId", userId)
      .eq("status", "COMPLETED");

    if (callsError) throw callsError;

    // Get guide payout payments
    const { data: payments, error: paymentsError } = await supabase
      .from("Payment")
      .select("id, amount, type, status, createdAt, metadata")
      .eq("userId", userId)
      .eq("type", "GUIDE_PAYOUT")
      .order("createdAt", { ascending: false })
      .limit(20);

    if (paymentsError) throw paymentsError;

    const callEarnings = (calls || []).reduce((sum, c) => sum + (c.contributorPayout || 0), 0);

    // Recording earnings = total payouts - call earnings (or from payments)
    const totalPayouts = (payments || [])
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Build recent transactions from both calls and payments
    const recentTransactions = [
      ...(calls || []).map((c) => ({
        id: c.id,
        date: c.scheduledAt,
        type: "call" as const,
        description: `${c.durationMinutes} min call`,
        amount: c.contributorPayout || 0,
      })),
      ...(payments || []).map((p) => ({
        id: p.id,
        date: p.createdAt,
        type: "payout" as const,
        description: (p.metadata as any)?.description || "Payout",
        amount: p.amount || 0,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return NextResponse.json({
      totalEarnings: callEarnings + totalPayouts,
      callEarnings,
      recordingEarnings: totalPayouts,
      recentTransactions,
    });
  } catch (error) {
    console.error("Error fetching guide earnings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
