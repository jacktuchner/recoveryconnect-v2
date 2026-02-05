import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

// Type for per-procedure profile data
interface ProcedureProfileData {
  procedureDetails?: string;
  timeSinceSurgery?: string;
  recoveryGoals?: string[];
  complicatingFactors?: string[];
}

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

    // Handle procedureTypes array
    const procedureTypes = body.procedureTypes || (body.procedureType ? [body.procedureType] : []);
    const primaryProcedure = body.procedureType || procedureTypes[0] || "";
    const activeProcedure = body.activeProcedureType || primaryProcedure;

    // Build procedureProfiles if not provided
    let procedureProfiles = body.procedureProfiles || {};
    if (primaryProcedure && !procedureProfiles[primaryProcedure]) {
      procedureProfiles[primaryProcedure] = {
        procedureDetails: body.procedureDetails || "",
        timeSinceSurgery: body.timeSinceSurgery || "",
        recoveryGoals: body.recoveryGoals || [],
        complicatingFactors: body.complicatingFactors || [],
      };
    }

    const { data: profile, error } = await supabase
      .from("Profile")
      .insert({
        id: uuidv4(),
        userId,
        procedureType: primaryProcedure,
        procedureTypes: procedureTypes,
        activeProcedureType: activeProcedure,
        procedureProfiles: procedureProfiles,
        // Keep legacy fields for backwards compatibility
        procedureDetails: body.procedureDetails || null,
        timeSinceSurgery: body.timeSinceSurgery || null,
        recoveryGoals: body.recoveryGoals || [],
        complicatingFactors: body.complicatingFactors || [],
        // Profile-wide fields
        ageRange: body.ageRange,
        activityLevel: body.activityLevel || "RECREATIONAL",
        lifestyleContext: body.lifestyleContext || [],
        hourlyRate: body.hourlyRate || null,
        isAvailableForCalls: body.isAvailableForCalls || false,
        introVideoUrl: body.introVideoUrl || null,
        introVideoDuration: body.introVideoDuration || null,
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

    // Handle procedureTypes array
    const procedureTypes = body.procedureTypes || (body.procedureType ? [body.procedureType] : []);
    const primaryProcedure = body.procedureType || procedureTypes[0] || "";

    // Build update object
    const updateData: Record<string, any> = {
      procedureType: primaryProcedure,
      procedureTypes: procedureTypes,
      // Profile-wide fields
      ageRange: body.ageRange,
      activityLevel: body.activityLevel || "RECREATIONAL",
      lifestyleContext: body.lifestyleContext || [],
      hourlyRate: body.hourlyRate || null,
      isAvailableForCalls: body.isAvailableForCalls || false,
      updatedAt: new Date().toISOString(),
    };

    // Handle procedureProfiles
    if (body.procedureProfiles !== undefined) {
      updateData.procedureProfiles = body.procedureProfiles;
    }

    // Keep legacy fields updated for backwards compatibility
    if (body.procedureDetails !== undefined) {
      updateData.procedureDetails = body.procedureDetails || null;
    }
    if (body.timeSinceSurgery !== undefined) {
      updateData.timeSinceSurgery = body.timeSinceSurgery || null;
    }
    if (body.recoveryGoals !== undefined) {
      updateData.recoveryGoals = body.recoveryGoals || [];
    }
    if (body.complicatingFactors !== undefined) {
      updateData.complicatingFactors = body.complicatingFactors || [];
    }

    // Update activeProcedureType if provided
    if (body.activeProcedureType !== undefined) {
      updateData.activeProcedureType = body.activeProcedureType;
    }

    // Update intro video fields if provided
    if (body.introVideoUrl !== undefined) {
      updateData.introVideoUrl = body.introVideoUrl || null;
    }
    if (body.introVideoDuration !== undefined) {
      updateData.introVideoDuration = body.introVideoDuration || null;
    }

    const { data: profile, error } = await supabase
      .from("Profile")
      .update(updateData)
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
