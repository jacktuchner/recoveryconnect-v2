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
    const { status, adminNotes } = body;

    if (!status || !["PENDING", "REVIEWED", "ACTION_TAKEN", "DISMISSED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be PENDING, REVIEWED, ACTION_TAKEN, or DISMISSED" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const isResolved = status !== "PENDING";

    const { data: report, error } = await supabase
      .from("Report")
      .update({
        status,
        adminNotes: adminNotes || null,
        resolvedBy: isResolved ? userId : null,
        resolvedAt: isResolved ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        reporter:User!Report_reporterId_fkey(id, name, email),
        recording:Recording(id, title, contributorId),
        reportedUser:User!Report_userId_fkey(id, name, email),
        call:Call(id, scheduledAt, patientId, contributorId)
      `)
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

export async function GET(
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

    const { data: report, error } = await supabase
      .from("Report")
      .select(`
        *,
        reporter:User!Report_reporterId_fkey(id, name, email),
        recording:Recording(id, title, contributorId, mediaUrl, description),
        reportedUser:User!Report_userId_fkey(id, name, email, bio),
        call:Call(id, scheduledAt, patientId, contributorId, status)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
