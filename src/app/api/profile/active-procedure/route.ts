import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// PATCH /api/profile/active-procedure - Switch active procedure
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { procedureType } = body;

    if (!procedureType) {
      return NextResponse.json(
        { error: "procedureType is required" },
        { status: 400 }
      );
    }

    // Verify the procedure is in the user's procedureTypes
    const { data: existingProfile } = await supabase
      .from("Profile")
      .select("procedureTypes")
      .eq("userId", userId)
      .single();

    if (!existingProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const procedures = existingProfile.procedureTypes || [];
    if (!procedures.includes(procedureType)) {
      return NextResponse.json(
        { error: "Procedure not in your profile" },
        { status: 400 }
      );
    }

    // Update active procedure
    const { data: profile, error } = await supabase
      .from("Profile")
      .update({
        activeProcedureType: procedureType,
        procedureType: procedureType, // Also update primary for compatibility
        updatedAt: new Date().toISOString(),
      })
      .eq("userId", userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error switching active procedure:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
