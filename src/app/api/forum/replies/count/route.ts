import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    const { count, error } = await supabase
      .from("ForumReply")
      .select("id", { count: "exact", head: true })
      .eq("authorId", userId);

    if (error) throw error;

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error("Error fetching forum reply count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
