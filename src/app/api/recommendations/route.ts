import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { PROCEDURE_TYPES } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const procedure = searchParams.get("procedure");
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "most_recommended";
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");

    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as Record<string, string>).id : null;
    const userRole = (session?.user as any)?.role;
    const isContributor = userRole === "CONTRIBUTOR" || userRole === "BOTH" || userRole === "ADMIN";
    const isSubscriber = (session?.user as any)?.subscriptionStatus === "active";

    if (!isContributor && !isSubscriber) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }

    let query = supabase
      .from("Recommendation")
      .select(
        "*, endorsements:RecommendationEndorsement(id, contributorId, comment, recoveryPhase, contributor:User!RecommendationEndorsement_contributorId_fkey(id, name, image))",
        { count: "exact" }
      )
      .eq("status", "ACTIVE");

    if (procedure) {
      query = query.eq("procedureType", procedure);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (sort === "most_helpful") {
      query = query.order("helpfulCount", { ascending: false });
    } else if (sort === "newest") {
      query = query.order("createdAt", { ascending: false });
    } else {
      // most_recommended (default)
      query = query.order("endorsementCount", { ascending: false });
    }

    const offset = (page - 1) * PAGE_SIZE;
    query = query.range(offset, offset + PAGE_SIZE - 1);

    const { data: recommendations, error, count } = await query;

    if (error) throw error;

    // Check user votes if logged in
    let votedIds = new Set<string>();
    if (userId && recommendations && recommendations.length > 0) {
      const recIds = recommendations.map((r) => r.id);
      const { data: votes } = await supabase
        .from("RecommendationVote")
        .select("recommendationId")
        .eq("userId", userId)
        .in("recommendationId", recIds);

      if (votes) {
        votedIds = new Set(votes.map((v) => v.recommendationId));
      }
    }

    const total = count || 0;
    const enriched = (recommendations || []).map((r) => ({
      ...r,
      hasVoted: votedIds.has(r.id),
    }));

    return NextResponse.json({
      recommendations: enriched,
      pagination: {
        page,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
      return NextResponse.json({ error: "Only contributors can add recommendations" }, { status: 403 });
    }

    const body = await req.json();
    const { name, category, procedureType, description, location, url, priceRange, comment, recoveryPhase } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!procedureType || !(PROCEDURE_TYPES as readonly string[]).includes(procedureType)) {
      return NextResponse.json({ error: "Invalid procedure type" }, { status: 400 });
    }

    const normalizedName = name.trim().toLowerCase();
    const now = new Date().toISOString();

    // Check for existing recommendation
    const { data: existing } = await supabase
      .from("Recommendation")
      .select("id, endorsementCount")
      .eq("normalizedName", normalizedName)
      .eq("procedureType", procedureType)
      .single();

    if (existing) {
      // Check if contributor already endorsed
      const { data: existingEndorsement } = await supabase
        .from("RecommendationEndorsement")
        .select("id")
        .eq("recommendationId", existing.id)
        .eq("contributorId", userId)
        .single();

      if (existingEndorsement) {
        return NextResponse.json({ error: "You have already endorsed this recommendation" }, { status: 409 });
      }

      // Add endorsement to existing recommendation
      const { error: endorseError } = await supabase
        .from("RecommendationEndorsement")
        .insert({
          id: uuidv4(),
          recommendationId: existing.id,
          contributorId: userId,
          comment: comment?.trim() || null,
          recoveryPhase: recoveryPhase || null,
          source: "MANUAL",
          createdAt: now,
          updatedAt: now,
        });

      if (endorseError) throw endorseError;

      // Increment endorsement count
      const { error: updateError } = await supabase
        .from("Recommendation")
        .update({
          endorsementCount: (existing.endorsementCount || 0) + 1,
          updatedAt: now,
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;

      // Return the updated recommendation
      const { data: updated } = await supabase
        .from("Recommendation")
        .select("*, endorsements:RecommendationEndorsement(id, contributorId, comment, recoveryPhase, contributor:User!RecommendationEndorsement_contributorId_fkey(id, name, image))")
        .eq("id", existing.id)
        .single();

      return NextResponse.json(updated, { status: 200 });
    }

    // Create new recommendation + first endorsement
    const recId = uuidv4();

    const { error: createError } = await supabase
      .from("Recommendation")
      .insert({
        id: recId,
        name: name.trim(),
        normalizedName,
        category,
        procedureType,
        description: description?.trim() || null,
        location: location?.trim() || null,
        url: url?.trim() || null,
        priceRange: priceRange || null,
        status: "ACTIVE",
        endorsementCount: 1,
        helpfulCount: 0,
        createdById: userId,
        createdAt: now,
        updatedAt: now,
      });

    if (createError) throw createError;

    const { error: endorseError } = await supabase
      .from("RecommendationEndorsement")
      .insert({
        id: uuidv4(),
        recommendationId: recId,
        contributorId: userId,
        comment: comment?.trim() || null,
        recoveryPhase: recoveryPhase || null,
        source: "MANUAL",
        createdAt: now,
        updatedAt: now,
      });

    if (endorseError) throw endorseError;

    const { data: created } = await supabase
      .from("Recommendation")
      .select("*, endorsements:RecommendationEndorsement(id, contributorId, comment, recoveryPhase, contributor:User!RecommendationEndorsement_contributorId_fkey(id, name, image))")
      .eq("id", recId)
      .single();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating recommendation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
