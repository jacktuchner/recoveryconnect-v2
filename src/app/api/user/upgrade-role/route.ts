import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentRole = (session.user as any).role;

  // Only allow from PATIENT role
  if (currentRole !== "SEEKER") {
    return NextResponse.json(
      { error: "Already have contributor access" },
      { status: 400 }
    );
  }

  // Instead of instant upgrade, redirect to application form
  return NextResponse.json({
    redirect: "/guide-application",
    message: "Please complete the contributor application",
  });
}
