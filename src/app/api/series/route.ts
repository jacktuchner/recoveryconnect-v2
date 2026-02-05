import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getPublicDisplayName } from "@/lib/displayName";
import { v4 as uuidv4 } from "uuid";

// GET /api/series - List series with optional filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const procedure = searchParams.get("procedure");
    const contributorId = searchParams.get("contributorId");
    const status = searchParams.get("status"); // null means all statuses for own series
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    // Check if user is viewing their own series
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwnSeries = contributorId && userId === contributorId;

    let query = supabase
      .from("RecordingSeries")
      .select(
        `*,
        contributor:User!RecordingSeries_contributorId_fkey(id, name, displayName, showRealName),
        recordings:SeriesRecording(
          id, sequenceNumber,
          recording:Recording(id, title, price, durationSeconds, isVideo, status)
        )`,
        { count: "exact" }
      );

    // Filter by status - if viewing own series and no status specified, show all
    // Otherwise default to PUBLISHED for public viewing
    if (status) {
      query = query.eq("status", status);
    } else if (!isOwnSeries) {
      query = query.eq("status", "PUBLISHED");
    }
    // If isOwnSeries and no status, don't filter by status (show all)

    if (procedure) query = query.eq("procedureType", procedure);
    if (contributorId) query = query.eq("contributorId", contributorId);

    const { data: series, count, error } = await query
      .order("createdAt", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    const total = count || 0;

    // Transform series data
    const transformedSeries = (series || []).map((s: any) => {
      // Sort recordings by sequence number
      const sortedRecordings = (s.recordings || [])
        .sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber)
        .map((sr: any) => sr.recording)
        .filter((r: any) => r && r.status === "PUBLISHED");

      // Calculate pricing
      const totalValue = sortedRecordings.reduce((sum: number, r: any) => sum + (r?.price || 0), 0);
      const discountedPrice = totalValue * (1 - s.discountPercent / 100);
      const totalDuration = sortedRecordings.reduce((sum: number, r: any) => sum + (r?.durationSeconds || 0), 0);

      return {
        ...s,
        contributor: s.contributor
          ? {
              id: s.contributor.id,
              name: getPublicDisplayName(s.contributor),
            }
          : null,
        recordings: sortedRecordings,
        recordingCount: sortedRecordings.length,
        totalValue,
        discountedPrice,
        savings: totalValue - discountedPrice,
        totalDuration,
      };
    });

    return NextResponse.json({
      series: transformedSeries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching series:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/series - Create a new series (contributors only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    // Check user is a contributor
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("*, profile:Profile(*)")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!["CONTRIBUTOR", "BOTH", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only contributors can create series" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, procedureType, discountPercent, recordingIds } = body;

    if (!title || !procedureType) {
      return NextResponse.json(
        { error: "Title and procedure type are required" },
        { status: 400 }
      );
    }

    // Validate discount percent (5-30%)
    const discount = Math.min(30, Math.max(5, discountPercent || 15));

    // Create series
    const seriesId = uuidv4();
    const { data: series, error: seriesError } = await supabase
      .from("RecordingSeries")
      .insert({
        id: seriesId,
        contributorId: userId,
        title,
        description: description || null,
        procedureType,
        discountPercent: discount,
        status: "DRAFT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (seriesError) throw seriesError;

    // Add recordings if provided
    if (recordingIds && recordingIds.length > 0) {
      // Verify all recordings belong to this contributor
      const { data: recordings, error: recError } = await supabase
        .from("Recording")
        .select("id")
        .eq("contributorId", userId)
        .in("id", recordingIds);

      if (recError) throw recError;

      const validRecordingIds = new Set((recordings || []).map((r: any) => r.id));

      const seriesRecordings = recordingIds
        .filter((id: string) => validRecordingIds.has(id))
        .map((recordingId: string, index: number) => ({
          id: uuidv4(),
          seriesId,
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

    return NextResponse.json(series, { status: 201 });
  } catch (error) {
    console.error("Error creating series:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
