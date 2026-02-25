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

    // Get seekers who have shared their journal with this guide
    const { data: shares, error } = await supabase
      .from("JournalShare")
      .select("patientId, createdAt")
      .eq("contributorId", userId)
      .order("createdAt", { ascending: false });

    if (error) throw error;

    if (!shares || shares.length === 0) {
      return NextResponse.json({ seekers: [] });
    }

    const seekerIds = shares.map((s: any) => s.patientId);

    // Get seeker details
    const { data: seekers, error: seekersError } = await supabase
      .from("User")
      .select("id, name, image")
      .in("id", seekerIds);

    if (seekersError) throw seekersError;

    // Get shared entry counts per seeker
    const { data: entryCounts, error: countError } = await supabase
      .from("JournalEntry")
      .select("patientId")
      .in("patientId", seekerIds)
      .eq("isShared", true);

    if (countError) throw countError;

    const countMap: Record<string, number> = {};
    for (const e of entryCounts || []) {
      countMap[e.patientId] = (countMap[e.patientId] || 0) + 1;
    }

    const seekerMap = new Map((seekers || []).map((p: any) => [p.id, p]));

    const result = shares.map((s: any) => {
      const seeker = seekerMap.get(s.patientId) as any;
      return {
        seekerId: s.patientId,
        name: seeker?.name || "Seeker",
        image: seeker?.image || null,
        sharedEntryCount: countMap[s.patientId] || 0,
        sharedAt: s.createdAt,
      };
    });

    return NextResponse.json({ seekers: result });
  } catch (error) {
    console.error("Error fetching received journal shares:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
