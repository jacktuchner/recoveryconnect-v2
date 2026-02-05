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
    const { status, notes } = body;

    if (!status || !["PENDING", "RESOLVED", "DISMISSED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be PENDING, RESOLVED, or DISMISSED" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    const { data: report, error } = await supabase
      .from("Report")
      .update({
        status,
        reviewedBy: userId,
        reviewedAt: new Date().toISOString(),
        reviewNotes: notes || null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
