import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("Profile")
      .select("*")
      .eq("userId", (session.user as any).id)
      .single();

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/profile - Create profile
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const { data: existing } = await supabase
      .from("Profile")
      .select("id")
      .eq("userId", userId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Profile already exists. Use PUT to update." }, { status: 409 });
    }

    // Handle procedureTypes array - use first one as primary procedureType
    const procedureTypes = body.procedureTypes || (body.procedureType ? [body.procedureType] : []);
    const primaryProcedure = body.procedureType || procedureTypes[0] || "";

    const { data: profile, error } = await supabase
      .from("Profile")
      .insert({
        id: uuidv4(),
        userId,
        procedureType: primaryProcedure,
        procedureTypes: procedureTypes,
        procedureDetails: body.procedureDetails || null,
        ageRange: body.ageRange,
        activityLevel: body.activityLevel || "RECREATIONAL",
        recoveryGoals: body.recoveryGoals || [],
        timeSinceSurgery: body.timeSinceSurgery || null,
        complicatingFactors: body.complicatingFactors || [],
        lifestyleContext: body.lifestyleContext || [],
        hourlyRate: body.hourlyRate || null,
        isAvailableForCalls: body.isAvailableForCalls || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/profile - Update profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    // Handle procedureTypes array - use first one as primary procedureType
    const procedureTypes = body.procedureTypes || (body.procedureType ? [body.procedureType] : []);
    const primaryProcedure = body.procedureType || procedureTypes[0] || "";

    const { data: profile, error } = await supabase
      .from("Profile")
      .update({
        procedureType: primaryProcedure,
        procedureTypes: procedureTypes,
        procedureDetails: body.procedureDetails || null,
        ageRange: body.ageRange,
        activityLevel: body.activityLevel || "RECREATIONAL",
        recoveryGoals: body.recoveryGoals || [],
        timeSinceSurgery: body.timeSinceSurgery || null,
        complicatingFactors: body.complicatingFactors || [],
        lifestyleContext: body.lifestyleContext || [],
        hourlyRate: body.hourlyRate || null,
        isAvailableForCalls: body.isAvailableForCalls || false,
        updatedAt: new Date().toISOString(),
      })
      .eq("userId", userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
