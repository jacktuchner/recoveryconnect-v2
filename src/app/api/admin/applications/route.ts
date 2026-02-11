import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET — list all applications with filters
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // PENDING_REVIEW, APPROVED, REJECTED
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  let query = supabase
    .from("ContributorApplication")
    .select("*", { count: "exact" });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: applications, count, error } = await query
    .order("createdAt", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Fetch related users separately (no FK join needed)
  const userIds = (applications || []).map((a: any) => a.userId);
  let usersMap: Record<string, any> = {};

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("User")
      .select("id, name, email, role, contributorStatus, createdAt")
      .in("id", userIds);

    if (users) {
      usersMap = Object.fromEntries(users.map((u: any) => [u.id, u]));
    }
  }

  const applicationsWithUsers = (applications || []).map((app: any) => ({
    ...app,
    user: usersMap[app.userId] || { id: app.userId, name: "Unknown", email: "", role: "", contributorStatus: null, createdAt: "" },
  }));

  return NextResponse.json({
    applications: applicationsWithUsers,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
