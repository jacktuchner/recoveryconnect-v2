import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";
import { sendCallBookedEmail } from "@/lib/email";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    const { data: calls, error } = await supabase
      .from("Call")
      .select("*, seeker:User!Call_patientId_fkey(*), guide:User!Call_contributorId_fkey(*, profile:Profile(*)), reviews:Review(*)")
      .or(`patientId.eq.${userId},contributorId.eq.${userId}`)
      .order("scheduledAt", { ascending: false });

    if (error) throw error;

    return NextResponse.json(calls);
  } catch (error) {
    console.error("Error fetching calls:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const body = await req.json();
    const { contributorId, scheduledAt, durationMinutes, questionsInAdvance } =
      body;

    if (!contributorId || !scheduledAt) {
      return NextResponse.json(
        { error: "Guide ID and scheduled time are required" },
        { status: 400 }
      );
    }

    const { data: guide, error: contribError } = await supabase
      .from("User")
      .select("*, profile:Profile(*)")
      .eq("id", contributorId)
      .single();

    if (contribError || !guide?.profile?.isAvailableForCalls) {
      return NextResponse.json(
        { error: "This guide is not available for calls" },
        { status: 400 }
      );
    }

    const rate = guide.profile.hourlyRate || 50;
    const duration = durationMinutes || 30;
    const price = duration === 60 ? rate : rate / 2;
    const platformFee = price * (PLATFORM_FEE_PERCENT / 100);
    const contributorPayout = price - platformFee;

    const { data: call, error } = await supabase
      .from("Call")
      .insert({
        id: uuidv4(),
        patientId: userId,
        contributorId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: duration,
        questionsInAdvance,
        price,
        platformFee,
        contributorPayout,
        status: "REQUESTED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select("*, seeker:User!Call_patientId_fkey(*), guide:User!Call_contributorId_fkey(*, profile:Profile(*))")
      .single();

    if (error) throw error;

    // Send email notification to guide
    if (call.guide?.email) {
      sendCallBookedEmail(
        call.guide.email,
        call.guide.name || "Guide",
        call.seeker?.name || "A seeker",
        new Date(call.scheduledAt),
        call.durationMinutes,
        call.questionsInAdvance
      ).catch((err) => console.error("Failed to send call booked email:", err));
    }

    return NextResponse.json(call, { status: 201 });
  } catch (error) {
    console.error("Error booking call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
