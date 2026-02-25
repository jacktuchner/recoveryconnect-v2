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

    // Get recording counts by status
    const { count: pendingRecordings } = await supabase
      .from("Recording")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING_REVIEW");

    const { count: publishedRecordings } = await supabase
      .from("Recording")
      .select("*", { count: "exact", head: true })
      .eq("status", "PUBLISHED");

    // Get user counts
    const { count: totalUsers } = await supabase
      .from("User")
      .select("*", { count: "exact", head: true });

    const { count: totalGuides } = await supabase
      .from("User")
      .select("*", { count: "exact", head: true })
      .in("role", ["GUIDE", "BOTH"]);

    // Get pending reports count
    const { count: pendingReports } = await supabase
      .from("Report")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING");

    // Get total calls
    const { count: totalCalls } = await supabase
      .from("Call")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      pendingRecordings: pendingRecordings || 0,
      publishedRecordings: publishedRecordings || 0,
      totalUsers: totalUsers || 0,
      totalGuides: totalGuides || 0,
      pendingReports: pendingReports || 0,
      totalCalls: totalCalls || 0,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
