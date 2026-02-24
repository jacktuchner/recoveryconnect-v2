import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const currentRole = (session.user as any).role;

  // SEEKER → redirect to guide application
  if (currentRole === "SEEKER") {
    return NextResponse.json({
      redirect: "/guide-application",
      message: "Please complete the contributor application",
    });
  }

  // GUIDE → upgrade to BOTH
  if (currentRole === "GUIDE") {
    const { error } = await supabase
      .from("User")
      .update({ role: "BOTH", updatedAt: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      console.error("Error upgrading role to BOTH:", error);
      return NextResponse.json(
        { error: "Failed to upgrade role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      redirect: "/dashboard/seeker",
    });
  }

  // BOTH or ADMIN — already have both roles
  return NextResponse.json(
    { error: "Already have both roles" },
    { status: 400 }
  );
}
