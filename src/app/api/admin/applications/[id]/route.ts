import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { sendApplicationApprovedEmail, sendApplicationRejectedEmail } from "@/lib/email";

// PATCH — approve/reject application, update zoomCompleted, add reviewNote
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const adminId = (session.user as any).id;
  const body = await req.json();
  const { action, zoomCompleted, reviewNote } = body;

  // Fetch the application
  const { data: application, error: fetchError } = await supabase
    .from("ContributorApplication")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
    reviewedById: adminId,
  };

  if (zoomCompleted !== undefined) {
    updates.zoomCompleted = zoomCompleted;
  }

  if (reviewNote !== undefined) {
    updates.reviewNote = reviewNote;
  }

  if (action === "approve") {
    updates.status = "APPROVED";

    // Check current role to determine new role
    const { data: currentUser } = await supabase
      .from("User")
      .select("role")
      .eq("id", application.userId)
      .single();

    // Patients who applied become BOTH (keep patient access). Already-CONTRIBUTOR stays CONTRIBUTOR.
    const newRole = currentUser?.role === "PATIENT" ? "BOTH" : currentUser?.role === "BOTH" ? "BOTH" : "CONTRIBUTOR";

    // Update user: set role and contributorStatus = APPROVED
    const { error: userError } = await supabase
      .from("User")
      .update({
        role: newRole,
        contributorStatus: "APPROVED",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", application.userId);

    if (userError) {
      console.error("Error updating user on approve:", userError);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
  } else if (action === "reject") {
    updates.status = "REJECTED";

    // Update user: set contributorStatus = REJECTED, role back to PATIENT
    const { error: userError } = await supabase
      .from("User")
      .update({
        contributorStatus: "REJECTED",
        role: "PATIENT",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", application.userId);

    if (userError) {
      console.error("Error updating user on reject:", userError);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
  }

  // Update the application
  const { data: updated, error: updateError } = await supabase
    .from("ContributorApplication")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    console.error("Error updating application:", updateError);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }

  // Send email notification to applicant on approve/reject
  if (action === "approve" || action === "reject") {
    const { data: applicant } = await supabase
      .from("User")
      .select("email, name")
      .eq("id", application.userId)
      .single();

    if (applicant?.email) {
      const name = applicant.name || "there";
      if (action === "approve") {
        sendApplicationApprovedEmail(applicant.email, name).catch(() => {});
      } else {
        sendApplicationRejectedEmail(applicant.email, name).catch(() => {});
      }
    }
  }

  return NextResponse.json({ application: updated });
}
