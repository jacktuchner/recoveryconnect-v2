import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  PROCEDURE_TYPES,
  MIN_GROUP_SESSION_PRICE,
  MAX_GROUP_SESSION_PRICE,
  MIN_GROUP_CAPACITY,
  MAX_GROUP_CAPACITY,
  DEFAULT_MIN_ATTENDEES,
  GROUP_SESSION_DURATIONS,
} from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const procedureType = searchParams.get("procedureType");
    const contributorId = searchParams.get("contributorId");
    const participating = searchParams.get("participating");

    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as Record<string, string>).id : null;

    // If requesting "participating", must be authenticated
    if (participating === "true" && !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (participating === "true" && userId) {
      // Get sessions where user is a participant
      const { data: participantRecords, error: partError } = await supabase
        .from("GroupSessionParticipant")
        .select("groupSessionId, status, pricePaid, wasSubscriber")
        .eq("userId", userId)
        .in("status", ["REGISTERED", "ATTENDED"]);

      if (partError) throw partError;

      if (!participantRecords || participantRecords.length === 0) {
        return NextResponse.json([]);
      }

      const sessionIds = participantRecords.map((p) => p.groupSessionId);

      const { data: sessions, error: sessError } = await supabase
        .from("GroupSession")
        .select("*, contributor:User!GroupSession_contributorId_fkey(id, name, image)")
        .in("id", sessionIds)
        .order("scheduledAt", { ascending: true });

      if (sessError) throw sessError;

      // Attach participant info and count
      const enriched = await Promise.all(
        (sessions || []).map(async (s) => {
          const { count } = await supabase
            .from("GroupSessionParticipant")
            .select("id", { count: "exact", head: true })
            .eq("groupSessionId", s.id)
            .eq("status", "REGISTERED");

          const myParticipation = participantRecords.find((p) => p.groupSessionId === s.id);
          return {
            ...s,
            participantCount: count || 0,
            myStatus: myParticipation?.status,
            myPricePaid: myParticipation?.pricePaid,
          };
        })
      );

      return NextResponse.json(enriched);
    }

    // Default: list upcoming sessions
    let query = supabase
      .from("GroupSession")
      .select("*, contributor:User!GroupSession_contributorId_fkey(id, name, image)")
      .in("status", ["SCHEDULED", "CONFIRMED"])
      .gt("scheduledAt", new Date().toISOString())
      .order("scheduledAt", { ascending: true });

    if (procedureType) {
      query = query.eq("procedureType", procedureType);
    }

    if (contributorId) {
      query = query.eq("contributorId", contributorId);
    }

    const { data: sessions, error } = await query;

    if (error) throw error;

    // Add participant counts
    const enriched = await Promise.all(
      (sessions || []).map(async (s) => {
        const { count } = await supabase
          .from("GroupSessionParticipant")
          .select("id", { count: "exact", head: true })
          .eq("groupSessionId", s.id)
          .eq("status", "REGISTERED");

        return { ...s, participantCount: count || 0 };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching group sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const userRole = (session.user as any).role;

    if (userRole !== "CONTRIBUTOR" && userRole !== "BOTH" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Only contributors can create group sessions" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, procedureType, scheduledAt, durationMinutes, maxCapacity, pricePerPerson } = body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!procedureType || !(PROCEDURE_TYPES as readonly string[]).includes(procedureType)) {
      return NextResponse.json({ error: "Invalid procedure type" }, { status: 400 });
    }

    const scheduledDate = new Date(scheduledAt);
    const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (isNaN(scheduledDate.getTime()) || scheduledDate < minDate) {
      return NextResponse.json({ error: "Session must be scheduled at least 24 hours in advance" }, { status: 400 });
    }

    if (!GROUP_SESSION_DURATIONS.includes(durationMinutes)) {
      return NextResponse.json({ error: `Duration must be one of: ${GROUP_SESSION_DURATIONS.join(", ")} minutes` }, { status: 400 });
    }

    if (!maxCapacity || maxCapacity < MIN_GROUP_CAPACITY || maxCapacity > MAX_GROUP_CAPACITY) {
      return NextResponse.json({ error: `Capacity must be between ${MIN_GROUP_CAPACITY} and ${MAX_GROUP_CAPACITY}` }, { status: 400 });
    }

    if (!pricePerPerson || pricePerPerson < MIN_GROUP_SESSION_PRICE || pricePerPerson > MAX_GROUP_SESSION_PRICE) {
      return NextResponse.json({ error: `Price must be between $${MIN_GROUP_SESSION_PRICE} and $${MAX_GROUP_SESSION_PRICE}` }, { status: 400 });
    }

    // Check for schedule conflicts
    const sessionEnd = new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000);
    const sessionStart = scheduledDate;

    const { data: conflictingCalls } = await supabase
      .from("Call")
      .select("id, scheduledAt, durationMinutes")
      .eq("contributorId", userId)
      .in("status", ["REQUESTED", "CONFIRMED"])
      .gte("scheduledAt", new Date(sessionStart.getTime() - 2 * 60 * 60 * 1000).toISOString())
      .lte("scheduledAt", sessionEnd.toISOString());

    if (conflictingCalls && conflictingCalls.length > 0) {
      const hasConflict = conflictingCalls.some((call) => {
        const callStart = new Date(call.scheduledAt);
        const callEnd = new Date(callStart.getTime() + call.durationMinutes * 60 * 1000);
        return callStart < sessionEnd && callEnd > sessionStart;
      });
      if (hasConflict) {
        return NextResponse.json({ error: "You have a conflicting call at this time" }, { status: 400 });
      }
    }

    const { data: conflictingSessions } = await supabase
      .from("GroupSession")
      .select("id, scheduledAt, durationMinutes")
      .eq("contributorId", userId)
      .in("status", ["SCHEDULED", "CONFIRMED"])
      .gte("scheduledAt", new Date(sessionStart.getTime() - 2 * 60 * 60 * 1000).toISOString())
      .lte("scheduledAt", sessionEnd.toISOString());

    if (conflictingSessions && conflictingSessions.length > 0) {
      const hasConflict = conflictingSessions.some((gs) => {
        const gsStart = new Date(gs.scheduledAt);
        const gsEnd = new Date(gsStart.getTime() + gs.durationMinutes * 60 * 1000);
        return gsStart < sessionEnd && gsEnd > sessionStart;
      });
      if (hasConflict) {
        return NextResponse.json({ error: "You have a conflicting group session at this time" }, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    const { data: newSession, error } = await supabase
      .from("GroupSession")
      .insert({
        id: uuidv4(),
        contributorId: userId,
        title: title.trim(),
        description: description?.trim() || null,
        procedureType,
        scheduledAt: scheduledDate.toISOString(),
        durationMinutes,
        maxCapacity,
        minAttendees: DEFAULT_MIN_ATTENDEES,
        pricePerPerson,
        freeForSubscribers: true,
        status: "SCHEDULED",
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error creating group session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
