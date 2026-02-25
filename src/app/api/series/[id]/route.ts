import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getPublicDisplayName } from "@/lib/displayName";
import { v4 as uuidv4 } from "uuid";

// GET /api/series/[id] - Get series detail with recordings
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const { data: series, error } = await supabase
      .from("RecordingSeries")
      .select(
        `*,
        guide:User!RecordingSeries_contributorId_fkey(id, name, displayName, showRealName, bio, profile:Profile(*)),
        recordings:SeriesRecording(
          id, sequenceNumber,
          recording:Recording(id, title, description, price, durationSeconds, isVideo, status, mediaUrl, thumbnailUrl, category, procedureType, ageRange, activityLevel)
        ),
        access:SeriesAccess(userId)`
      )
      .eq("id", id)
      .single();

    if (error || !series) {
      return NextResponse.json(
        { error: "Series not found" },
        { status: 404 }
      );
    }

    // All series are now free — always grant access
    const hasAccess = true;
    const isGuide = userId === series.contributorId;

    // Sort recordings by sequence number
    const sortedRecordings = (series.recordings || [])
      .sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber)
      .map((sr: any) => ({
        ...sr.recording,
        sequenceNumber: sr.sequenceNumber,
      }))
      .filter((r: any) => r && (r.status === "PUBLISHED" || isGuide));

    // Calculate pricing
    const totalValue = sortedRecordings.reduce((sum: number, r: any) => sum + (r?.price || 0), 0);
    const discountedPrice = totalValue * (1 - series.discountPercent / 100);
    const totalDuration = sortedRecordings.reduce((sum: number, r: any) => sum + (r?.durationSeconds || 0), 0);

    // All content is free — always include full data
    const publicRecordings = sortedRecordings;

    return NextResponse.json({
      ...series,
      guide: series.guide
        ? {
            id: series.guide.id,
            name: getPublicDisplayName(series.guide),
            bio: series.guide.bio,
            profile: series.guide.profile,
          }
        : null,
      recordings: publicRecordings,
      recordingCount: sortedRecordings.length,
      totalValue,
      discountedPrice,
      savings: totalValue - discountedPrice,
      totalDuration,
      hasAccess: hasAccess || isGuide,
      isGuide,
      access: undefined, // Don't expose access list
    });
  } catch (error) {
    console.error("Error fetching series:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/series/[id] - Update series (add/remove recordings, reorder, change settings)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Verify ownership
    const { data: series, error: fetchError } = await supabase
      .from("RecordingSeries")
      .select("*")
      .eq("id", id)
      .eq("contributorId", userId)
      .single();

    if (fetchError || !series) {
      return NextResponse.json(
        { error: "Series not found or you don't have permission" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { title, description, discountPercent, status, recordingIds } = body;

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (discountPercent !== undefined) {
      updateData.discountPercent = Math.min(30, Math.max(5, discountPercent));
    }
    if (status !== undefined && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      // If publishing, verify there are at least 2 recordings
      if (status === "PUBLISHED") {
        const { count: recordingCount } = await supabase
          .from("SeriesRecording")
          .select("*", { count: "exact", head: true })
          .eq("seriesId", id);

        if (!recordingCount || recordingCount < 2) {
          return NextResponse.json(
            { error: "Series must have at least 2 recordings to publish" },
            { status: 400 }
          );
        }
      }
      updateData.status = status;
    }

    // Update series
    const { data: updatedSeries, error: updateError } = await supabase
      .from("RecordingSeries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update recordings if provided
    if (recordingIds !== undefined) {
      // Delete existing series recordings
      await supabase
        .from("SeriesRecording")
        .delete()
        .eq("seriesId", id);

      if (recordingIds.length > 0) {
        // Verify all recordings belong to this guide
        const { data: recordings, error: recError } = await supabase
          .from("Recording")
          .select("id")
          .eq("contributorId", userId)
          .in("id", recordingIds);

        if (recError) throw recError;

        const validRecordingIds = new Set((recordings || []).map((r: any) => r.id));

        const seriesRecordings = recordingIds
          .filter((recId: string) => validRecordingIds.has(recId))
          .map((recordingId: string, index: number) => ({
            id: uuidv4(),
            seriesId: id,
            recordingId,
            sequenceNumber: index + 1,
          }));

        if (seriesRecordings.length > 0) {
          const { error: insertError } = await supabase
            .from("SeriesRecording")
            .insert(seriesRecordings);

          if (insertError) throw insertError;
        }
      }
    }

    return NextResponse.json(updatedSeries);
  } catch (error) {
    console.error("Error updating series:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/series/[id] - Delete series
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

    const userId = (session.user as any).id;

    // Verify ownership
    const { data: series, error: fetchError } = await supabase
      .from("RecordingSeries")
      .select("*")
      .eq("id", id)
      .eq("contributorId", userId)
      .single();

    if (fetchError || !series) {
      return NextResponse.json(
        { error: "Series not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Check if series has any purchases
    const { count: accessCount } = await supabase
      .from("SeriesAccess")
      .select("*", { count: "exact", head: true })
      .eq("seriesId", id);

    if (accessCount && accessCount > 0) {
      // Archive instead of delete if there are purchases
      const { error: archiveError } = await supabase
        .from("RecordingSeries")
        .update({ status: "ARCHIVED", updatedAt: new Date().toISOString() })
        .eq("id", id);

      if (archiveError) throw archiveError;

      return NextResponse.json({ message: "Series archived (has existing purchases)" });
    }

    // Delete series recordings (cascade should handle this, but be explicit)
    await supabase
      .from("SeriesRecording")
      .delete()
      .eq("seriesId", id);

    // Delete series
    const { error: deleteError } = await supabase
      .from("RecordingSeries")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: "Series deleted" });
  } catch (error) {
    console.error("Error deleting series:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
