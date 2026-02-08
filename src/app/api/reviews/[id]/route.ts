import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    // Verify ownership
    const { data: existing } = await supabase
      .from("Review")
      .select("authorId")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (existing.authorId !== userId) {
      return NextResponse.json({ error: "Not authorized to edit this review" }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, any> = {};

    if (body.rating !== undefined) {
      if (body.rating < 1 || body.rating > 5) {
        return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
      }
      updates.rating = body.rating;
    }
    if (body.matchRelevance !== undefined) updates.matchRelevance = body.matchRelevance;
    if (body.helpfulness !== undefined) updates.helpfulness = body.helpfulness;
    if (body.comment !== undefined) updates.comment = body.comment;

    const { data: review, error } = await supabase
      .from("Review")
      .update(updates)
      .eq("id", id)
      .select("*, author:User!Review_authorId_fkey(id, name, image)")
      .single();

    if (error) throw error;

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const userRole = (session.user as any).role;

    // Verify ownership or admin
    const { data: existing } = await supabase
      .from("Review")
      .select("authorId")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (existing.authorId !== userId && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized to delete this review" }, { status: 403 });
    }

    const { error } = await supabase
      .from("Review")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
