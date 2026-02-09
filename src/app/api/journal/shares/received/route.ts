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

    // Get patients who have shared their journal with this contributor
    const { data: shares, error } = await supabase
      .from("JournalShare")
      .select("patientId, createdAt")
      .eq("contributorId", userId)
      .order("createdAt", { ascending: false });

    if (error) throw error;

    if (!shares || shares.length === 0) {
      return NextResponse.json({ patients: [] });
    }

    const patientIds = shares.map((s: any) => s.patientId);

    // Get patient details
    const { data: patients, error: patientsError } = await supabase
      .from("User")
      .select("id, name, image")
      .in("id", patientIds);

    if (patientsError) throw patientsError;

    // Get shared entry counts per patient
    const { data: entryCounts, error: countError } = await supabase
      .from("JournalEntry")
      .select("patientId")
      .in("patientId", patientIds)
      .eq("isShared", true);

    if (countError) throw countError;

    const countMap: Record<string, number> = {};
    for (const e of entryCounts || []) {
      countMap[e.patientId] = (countMap[e.patientId] || 0) + 1;
    }

    const patientMap = new Map((patients || []).map((p: any) => [p.id, p]));

    const result = shares.map((s: any) => {
      const patient = patientMap.get(s.patientId) as any;
      return {
        patientId: s.patientId,
        name: patient?.name || "Patient",
        image: patient?.image || null,
        sharedEntryCount: countMap[s.patientId] || 0,
        sharedAt: s.createdAt,
      };
    });

    return NextResponse.json({ patients: result });
  } catch (error) {
    console.error("Error fetching received journal shares:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
