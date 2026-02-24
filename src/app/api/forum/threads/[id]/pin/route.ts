import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    const isGuideOrAdmin = userRole === "GUIDE" || userRole === "BOTH" || userRole === "ADMIN";

    if (!isGuideOrAdmin) {
      return NextResponse.json({ error: "Only guides and admins can pin threads" }, { status: 403 });
    }

    const { id } = await params;

    const { data: thread } = await supabase
      .from("ForumThread")
      .select("id, isPinned")
      .eq("id", id)
      .single();

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("ForumThread")
      .update({
        isPinned: !thread.isPinned,
        updatedAt: now,
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ isPinned: !thread.isPinned });
  } catch (error) {
    console.error("Error toggling pin:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
