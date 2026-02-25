import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId: seekerId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    // Verify the guide has an explicit journal share grant from this seeker
    const { data: shareGrant } = await supabase
      .from("JournalShare")
      .select("id")
      .eq("patientId", seekerId)
      .eq("contributorId", userId)
      .limit(1)
      .maybeSingle();

    if (!shareGrant) {
      return NextResponse.json(
        { error: "This seeker has not shared their journal with you" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const procedureType = searchParams.get("procedureType");

    let query = supabase
      .from("JournalEntry")
      .select("*")
      .eq("patientId", seekerId)
      .eq("isShared", true)
      .order("createdAt", { ascending: false });

    if (procedureType) {
      query = query.eq("procedureType", procedureType);
    }

    const { data: entries, error } = await query;

    if (error) throw error;

    return NextResponse.json(entries || []);
  } catch (error) {
    console.error("Error fetching shared journal entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
