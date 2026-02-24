import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const { data: recording, error } = await supabase
      .from("Recording")
      .select("*, contributor:User!Recording_contributorId_fkey(*, profile:Profile(*)), reviews:Review(*, author:User!Review_authorId_fkey(*))")
      .eq("id", id)
      .single();

    if (error || !recording) {
      return NextResponse.json(
        { error: "Recording not found" },
        { status: 404 }
      );
    }

    // All recordings are now free — always grant access
    const hasAccess = true;
    const isSubscriber = false;

    // Increment view count
    await supabase
      .from("Recording")
      .update({ viewCount: (recording.viewCount || 0) + 1 })
      .eq("id", id);

    // Check if recording is part of any published series
    const { data: seriesMemberships } = await supabase
      .from("SeriesRecording")
      .select("series:RecordingSeries(id, title, status)")
      .eq("recordingId", id);

    const publishedSeries = seriesMemberships
      ?.filter((sm: any) => sm.series?.status === "PUBLISHED")
      .map((sm: any) => ({ id: sm.series.id, title: sm.series.title })) || [];

    return NextResponse.json({
      ...recording,
      hasAccess,
      isSubscriber,
      series: publishedSeries.length > 0 ? publishedSeries[0] : null, // Return first series if multiple
    });
  } catch (error) {
    console.error("Error fetching recording:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/recordings/[id] - Update recording (contributor only)
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
    const { data: recording, error: fetchError } = await supabase
      .from("Recording")
      .select("*")
      .eq("id", id)
      .eq("contributorId", userId)
      .single();

    if (fetchError || !recording) {
      return NextResponse.json(
        { error: "Recording not found or you don't have permission" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { title, description, price, category } = body;

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (price !== undefined) updateData.price = Math.max(1, Math.min(50, price));
    if (category !== undefined) updateData.category = category;

    const { data: updatedRecording, error: updateError } = await supabase
      .from("Recording")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedRecording);
  } catch (error) {
    console.error("Error updating recording:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/recordings/[id] - Delete recording (contributor only)
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
    const { data: recording, error: fetchError } = await supabase
      .from("Recording")
      .select("*")
      .eq("id", id)
      .eq("contributorId", userId)
      .single();

    if (fetchError || !recording) {
      return NextResponse.json(
        { error: "Recording not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Check if recording has any purchases
    const { count: accessCount } = await supabase
      .from("RecordingAccess")
      .select("*", { count: "exact", head: true })
      .eq("recordingId", id);

    if (accessCount && accessCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete recording with existing purchases. Contact support for assistance." },
        { status: 400 }
      );
    }

    // Remove from any series first
    await supabase
      .from("SeriesRecording")
      .delete()
      .eq("recordingId", id);

    // Delete the recording
    const { error: deleteError } = await supabase
      .from("Recording")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: "Recording deleted" });
  } catch (error) {
    console.error("Error deleting recording:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
