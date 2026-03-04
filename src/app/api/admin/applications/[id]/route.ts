import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { sendApplicationApprovedEmail, sendApplicationRejectedEmail, sendNewGuideMatchEmail } from "@/lib/email";
import { v4 as uuidv4 } from "uuid";

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

    // Seekers who applied become BOTH (keep seeker access). Already-GUIDE stays GUIDE.
    const newRole = currentUser?.role === "SEEKER" ? "BOTH" : currentUser?.role === "BOTH" ? "BOTH" : "GUIDE";

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

    // Auto-create profile from application data if no profile exists
    if (application.applicationData) {
      const { data: existingProfile } = await supabase
        .from("Profile")
        .select("id")
        .eq("userId", application.userId)
        .single();

      if (!existingProfile) {
        const appData = application.applicationData as {
          selectedConditions?: string[];
          timeSince?: string;
          conditionCategory?: string;
        };

        const conditions = appData.selectedConditions || [];
        const primaryProcedure = conditions[0] || "Unknown";
        const conditionCategory = appData.conditionCategory || "SURGERY";

        // Build procedureProfiles with timeSince for each procedure
        const procedureProfiles: Record<string, { timeSinceSurgery?: string }> = {};
        for (const condition of conditions) {
          procedureProfiles[condition] = {
            timeSinceSurgery: appData.timeSince || undefined,
          };
        }

        const { error: profileError } = await supabase
          .from("Profile")
          .insert({
            id: uuidv4(),
            userId: application.userId,
            procedureType: primaryProcedure,
            procedureTypes: conditions,
            activeProcedureType: primaryProcedure,
            procedureProfiles,
            conditionCategory,
            ageRange: "Not set",
            activityLevel: "MODERATELY_ACTIVE",
            timeSinceSurgery: appData.timeSince || null,
            recoveryGoals: [],
            complicatingFactors: [],
            lifestyleContext: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        if (profileError) {
          console.error("Error auto-creating profile:", profileError);
          // Non-fatal — continue with approval
        }
      }
    }
  } else if (action === "reject") {
    updates.status = "REJECTED";

    // Update user: set contributorStatus = REJECTED, role back to SEEKER
    const { error: userError } = await supabase
      .from("User")
      .update({
        contributorStatus: "REJECTED",
        role: "SEEKER",
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

        // Notify matching seekers about the new guide
        const { data: guideProfile } = await supabase
          .from("Profile")
          .select("procedureTypes, procedureType")
          .eq("userId", application.userId)
          .single();

        const guideProcedures = guideProfile?.procedureTypes?.length
          ? guideProfile.procedureTypes
          : guideProfile?.procedureType
            ? [guideProfile.procedureType]
            : [];

        if (guideProcedures.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Find seekers with matching procedures who haven't been emailed today
          const { data: matchingSeekers } = await supabase
            .from("Profile")
            .select("userId, procedureType, User!inner(id, email, name, role, lastGuideMatchEmailAt)")
            .in("procedureType", guideProcedures)
            .neq("userId", application.userId);

          if (matchingSeekers) {
            for (const seeker of matchingSeekers) {
              const seekerUser = (seeker as any).User;
              if (!seekerUser?.email) continue;
              if (!["SEEKER", "BOTH"].includes(seekerUser.role)) continue;

              // Rate limit: max 1 per day
              if (seekerUser.lastGuideMatchEmailAt) {
                const lastSent = new Date(seekerUser.lastGuideMatchEmailAt);
                if (lastSent >= today) continue;
              }

              sendNewGuideMatchEmail(
                seekerUser.email,
                seekerUser.name || "there",
                name,
                guideProcedures,
                application.userId
              ).catch(() => {});

              // Update rate limit timestamp
              supabase
                .from("User")
                .update({ lastGuideMatchEmailAt: new Date().toISOString() })
                .eq("id", seekerUser.id)
                .then(() => {});
            }
          }
        }
      } else {
        sendApplicationRejectedEmail(applicant.email, name).catch(() => {});
      }
    }
  }

  return NextResponse.json({ application: updated });
}
