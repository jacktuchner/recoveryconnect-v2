import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    // Get distinct guides with COMPLETED calls for this seeker
    const { data: calls, error: callsError } = await supabase
      .from("Call")
      .select("contributorId")
      .eq("patientId", userId)
      .eq("status", "COMPLETED");

    if (callsError) throw callsError;

    const guideIds = [...new Set((calls || []).map((c: any) => c.contributorId))];

    if (guideIds.length === 0) {
      return NextResponse.json({ eligibleGuides: [] });
    }

    // Get guide details
    const { data: guides, error: guidesError } = await supabase
      .from("User")
      .select("id, name, image")
      .in("id", guideIds);

    if (guidesError) throw guidesError;

    // Get current shares
    const { data: shares, error: sharesError } = await supabase
      .from("JournalShare")
      .select("contributorId")
      .eq("patientId", userId);

    if (sharesError) throw sharesError;

    const sharedGuideIds = new Set((shares || []).map((s: any) => s.contributorId));

    const eligibleGuides = (guides || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      image: c.image,
      hasShare: sharedGuideIds.has(c.id),
    }));

    return NextResponse.json({ eligibleGuides });
  } catch (error) {
    console.error("Error fetching journal shares:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;


    const { contributorId: guideId } = await req.json();

    if (!guideId) {
      return NextResponse.json({ error: "contributorId is required" }, { status: 400 });
    }

    // Verify guide has a COMPLETED call with this seeker
    const { data: completedCall } = await supabase
      .from("Call")
      .select("id")
      .eq("patientId", userId)
      .eq("contributorId", guideId)
      .eq("status", "COMPLETED")
      .limit(1)
      .maybeSingle();

    if (!completedCall) {
      return NextResponse.json(
        { error: "You must have a completed call with this guide" },
        { status: 403 }
      );
    }

    // Insert share (handle duplicate gracefully)
    const { error } = await supabase
      .from("JournalShare")
      .upsert(
        { id: uuidv4(), patientId: userId, contributorId: guideId },
        { onConflict: "patientId,contributorId" }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating journal share:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const { contributorId: guideId } = await req.json();

    if (!guideId) {
      return NextResponse.json({ error: "contributorId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("JournalShare")
      .delete()
      .eq("patientId", userId)
      .eq("contributorId", guideId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting journal share:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
