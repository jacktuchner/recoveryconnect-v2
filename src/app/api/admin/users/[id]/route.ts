import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const adminId = (session.user as any).id;

    // Prevent self-deletion
    if (id === adminId) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    // Prevent deleting the last admin
    const { data: targetUser } = await supabase
      .from("User")
      .select("role")
      .eq("id", id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "ADMIN") {
      const { count } = await supabase
        .from("User")
        .select("*", { count: "exact", head: true })
        .eq("role", "ADMIN");

      if (count === 1) {
        return NextResponse.json({ error: "Cannot delete the last admin" }, { status: 400 });
      }
    }

    // Delete all related records in dependency order.
    // Each step logs errors but continues so partial cleanup doesn't block.

    // 1. Messages & Conversations (participant1Id / participant2Id)
    const { data: convos } = await supabase
      .from("Conversation")
      .select("id")
      .or(`participant1Id.eq.${id},participant2Id.eq.${id}`);
    if (convos?.length) {
      const convoIds = convos.map((c: any) => c.id);
      await supabase.from("Message").delete().in("conversationId", convoIds);
      await supabase.from("Conversation").delete().in("id", convoIds);
    }

    // 2. Journal
    await supabase.from("JournalShare").delete().eq("patientId", id);
    await supabase.from("JournalShare").delete().eq("contributorId", id);
    await supabase.from("JournalEntry").delete().eq("patientId", id);

    // 3. Recommendation children (user-level)
    await supabase.from("RecommendationComment").delete().eq("userId", id);
    await supabase.from("RecommendationVote").delete().eq("userId", id);
    await supabase.from("RecommendationEndorsement").delete().eq("contributorId", id);
    // Recommendations created by this user
    const { data: userRecs } = await supabase.from("Recommendation").select("id").eq("createdById", id);
    if (userRecs?.length) {
      const recIds = userRecs.map((r: any) => r.id);
      await supabase.from("RecommendationComment").delete().in("recommendationId", recIds);
      await supabase.from("RecommendationVote").delete().in("recommendationId", recIds);
      await supabase.from("RecommendationEndorsement").delete().in("recommendationId", recIds);
      await supabase.from("Recommendation").delete().in("id", recIds);
    }

    // 4. Group sessions
    await supabase.from("GroupSessionParticipant").delete().eq("userId", id);
    const { data: gs } = await supabase.from("GroupSession").select("id").eq("contributorId", id);
    if (gs?.length) {
      const gsIds = gs.map((g: any) => g.id);
      await supabase.from("GroupSessionParticipant").delete().in("groupSessionId", gsIds);
      await supabase.from("GroupSession").delete().in("id", gsIds);
    }

    // 5. Reviews (must go before Calls & Recordings since reviews FK to them)
    await supabase.from("Review").delete().eq("authorId", id);
    await supabase.from("Review").delete().eq("subjectId", id);

    // 6. Calls (delete reviews on these calls first)
    const { data: calls } = await supabase
      .from("Call")
      .select("id")
      .or(`patientId.eq.${id},contributorId.eq.${id}`);
    if (calls?.length) {
      const callIds = calls.map((c: any) => c.id);
      await supabase.from("Review").delete().in("callId", callIds);
      await supabase.from("Report").delete().in("callId", callIds);
      await supabase.from("Call").delete().in("id", callIds);
    }

    // 7. Subscriber views & access (before Recordings and Payments)
    await supabase.from("SubscriberView").delete().eq("userId", id);
    await supabase.from("RecordingAccess").delete().eq("userId", id);
    await supabase.from("SeriesAccess").delete().eq("userId", id);

    // 8. Recordings (contributor's content)
    const { data: recordings } = await supabase.from("Recording").select("id").eq("contributorId", id);
    if (recordings?.length) {
      const recIds = recordings.map((r: any) => r.id);
      await supabase.from("SubscriberView").delete().in("recordingId", recIds);
      await supabase.from("RecordingAccess").delete().in("recordingId", recIds);
      await supabase.from("Review").delete().in("recordingId", recIds);
      await supabase.from("Report").delete().in("recordingId", recIds);
      await supabase.from("SeriesRecording").delete().in("recordingId", recIds);
      await supabase.from("Recording").delete().in("id", recIds);
    }

    // 9. Series (contributor's series)
    const { data: seriesList } = await supabase.from("RecordingSeries").select("id").eq("contributorId", id);
    if (seriesList?.length) {
      const seriesIds = seriesList.map((s: any) => s.id);
      await supabase.from("SeriesRecording").delete().in("seriesId", seriesIds);
      await supabase.from("SeriesAccess").delete().in("seriesId", seriesIds);
      await supabase.from("RecordingSeries").delete().in("id", seriesIds);
    }

    // 10. Availability
    await supabase.from("Availability").delete().eq("contributorId", id);

    // 11. Payments (after RecordingAccess/SeriesAccess which reference Payment)
    await supabase.from("Payment").delete().eq("userId", id);

    // 12. Reports (both as reporter and as reported user)
    await supabase.from("Report").delete().eq("reporterId", id);
    await supabase.from("Report").delete().eq("userId", id);

    // 13. Auth, profile, application
    await supabase.from("Account").delete().eq("userId", id);
    await supabase.from("Session").delete().eq("userId", id);
    await supabase.from("ContributorApplication").delete().eq("userId", id);
    await supabase.from("Profile").delete().eq("userId", id);

    // 14. Delete the user
    const { error } = await supabase.from("User").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const { role } = body;

    if (!role || !["SEEKER", "GUIDE", "BOTH", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be PATIENT, CONTRIBUTOR, BOTH, or ADMIN" },
        { status: 400 }
      );
    }

    // Prevent demoting the last admin
    if (role !== "ADMIN") {
      const { count } = await supabase
        .from("User")
        .select("*", { count: "exact", head: true })
        .eq("role", "ADMIN");

      const { data: targetUser } = await supabase
        .from("User")
        .select("role")
        .eq("id", id)
        .single();

      if (targetUser?.role === "ADMIN" && count === 1) {
        return NextResponse.json(
          { error: "Cannot demote the last admin" },
          { status: 400 }
        );
      }
    }

    const { data: user, error } = await supabase
      .from("User")
      .update({ role, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
