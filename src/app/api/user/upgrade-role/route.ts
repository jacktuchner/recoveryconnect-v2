import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const currentRole = (session.user as any).role;

  // Only allow upgrade from CONTRIBUTOR to BOTH
  if (currentRole !== "CONTRIBUTOR") {
    return NextResponse.json(
      { error: "Only contributors can upgrade to patient access" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("User")
    .update({ role: "BOTH" })
    .eq("id", userId);

  if (error) {
    console.error("Failed to upgrade role:", error);
    return NextResponse.json(
      { error: "Failed to upgrade role" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, newRole: "BOTH" });
}
