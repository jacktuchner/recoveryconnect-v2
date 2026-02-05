import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { role } = body;

    if (!role || !["PATIENT", "CONTRIBUTOR", "BOTH", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be PATIENT, CONTRIBUTOR, BOTH, or ADMIN" },
        { status: 400 }
      );
    }

    // Prevent demoting the last admin
    if (role !== "ADMIN") {
      const { count } = await supabase
        .from("User")
        .select("*", { count: "exact", head: true })
        .eq("role", "ADMIN");

      const { data: targetUser } = await supabase
        .from("User")
        .select("role")
        .eq("id", id)
        .single();

      if (targetUser?.role === "ADMIN" && count === 1) {
        return NextResponse.json(
          { error: "Cannot demote the last admin" },
          { status: 400 }
        );
      }
    }

    const { data: user, error } = await supabase
      .from("User")
      .update({ role, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
