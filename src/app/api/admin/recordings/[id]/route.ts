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
    const { status, reason } = body;

    if (!status || !["PUBLISHED", "REJECTED", "PENDING_REVIEW"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be PUBLISHED, REJECTED, or PENDING_REVIEW" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    // Store rejection reason if provided
    if (status === "REJECTED" && reason) {
      updateData.rejectionReason = reason;
    }

    const { data: recording, error } = await supabase
      .from("Recording")
      .update(updateData)
      .eq("id", id)
      .select("*, contributor:User!Recording_contributorId_fkey(id, name, email)")
      .single();

    if (error) throw error;

    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    return NextResponse.json(recording);
  } catch (error) {
    console.error("Error updating recording status:", error);
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

    const { data: recording, error } = await supabase
      .from("Recording")
      .select("*, contributor:User!Recording_contributorId_fkey(id, name, email, profile:Profile(*))")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    return NextResponse.json(recording);
  } catch (error) {
    console.error("Error fetching recording:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
