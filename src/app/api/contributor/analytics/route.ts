import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function getLastSixMonths(): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    months.push({ key, label });
  }
  return months;
}

function toMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    // Verify user is a contributor
    const { data: user } = await supabase
      .from("User")
      .select("role")
      .eq("id", userId)
      .single();

    if (!user || !["CONTRIBUTOR", "BOTH", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const months = getLastSixMonths();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoISO = sixMonthsAgo.toISOString();

    // Run all queries in parallel
    const [
      callsResult,
      paymentsResult,
      recordingsResult,
      subscriberViewsResult,
      recordingAccessResult,
      reviewsResult,
      groupSessionsResult,
      participantsResult,
      seriesResult,
      recommendationsResult,
    ] = await Promise.all([
      // 1. All calls for this contributor
      supabase
        .from("Call")
        .select("id, contributorPayout, scheduledAt, durationMinutes, status, price, platformFee")
        .eq("contributorId", userId),

      // 2. Contributor payout payments
      supabase
        .from("Payment")
        .select("id, amount, type, status, createdAt, metadata")
        .eq("userId", userId)
        .eq("type", "CONTRIBUTOR_PAYOUT"),

      // 3. All recordings by this contributor
      supabase
        .from("Recording")
        .select("id, title, status, viewCount, price, category, createdAt, procedureType")
        .eq("contributorId", userId),

      // 4. Subscriber views for this contributor's recordings
      supabase
        .from("SubscriberView")
        .select("id, recordingId, viewedAt, Recording!inner(contributorId)")
        .eq("Recording.contributorId", userId),

      // 5. Recording access (purchases) for this contributor's recordings
      supabase
        .from("RecordingAccess")
        .select("id, recordingId, grantedAt, Recording!inner(contributorId)")
        .eq("Recording.contributorId", userId),

      // 6. Reviews where this contributor is the subject
      supabase
        .from("Review")
        .select("id, rating, matchRelevance, helpfulness, comment, createdAt")
        .eq("subjectId", userId),

      // 7. Group sessions by this contributor
      supabase
        .from("GroupSession")
        .select("id, title, scheduledAt, durationMinutes, maxCapacity, pricePerPerson, status, freeForSubscribers")
        .eq("contributorId", userId),

      // 8. Group session participants (joined via group sessions)
      supabase
        .from("GroupSessionParticipant")
        .select("id, groupSessionId, pricePaid, wasSubscriber, status, createdAt, GroupSession!inner(contributorId)")
        .eq("GroupSession.contributorId", userId),

      // 9. Recording series
      supabase
        .from("RecordingSeries")
        .select("id, status")
        .eq("contributorId", userId),

      // 10. Recommendations
      supabase
        .from("Recommendation")
        .select("id")
        .eq("createdById", userId),
    ]);

    const calls = callsResult.data || [];
    const payments = paymentsResult.data || [];
    const recordings = recordingsResult.data || [];
    const subscriberViews = subscriberViewsResult.data || [];
    const recordingAccesses = recordingAccessResult.data || [];
    const reviews = reviewsResult.data || [];
    const groupSessions = groupSessionsResult.data || [];
    const participants = participantsResult.data || [];
    const seriesList = seriesResult.data || [];
    const recommendationsList = recommendationsResult.data || [];

    // === REVENUE ===
    const callEarnings = calls
      .filter((c: any) => c.status === "COMPLETED")
      .reduce((sum: number, c: any) => sum + (c.contributorPayout || 0), 0);

    const recordingPayouts = payments
      .filter((p: any) => p.status === "COMPLETED")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const groupSessionEarnings = participants
      .filter((p: any) => p.status === "REGISTERED" || p.status === "ATTENDED")
      .reduce((sum: number, p: any) => sum + (p.pricePaid || 0), 0);

    // Monthly revenue (from calls + payments)
    const monthlyRevenueMap: Record<string, number> = {};
    months.forEach((m) => (monthlyRevenueMap[m.key] = 0));

    calls.filter((c: any) => c.status === "COMPLETED").forEach((c: any) => {
      const mk = toMonthKey(c.scheduledAt);
      if (monthlyRevenueMap[mk] !== undefined) {
        monthlyRevenueMap[mk] += c.contributorPayout || 0;
      }
    });

    payments.filter((p: any) => p.status === "COMPLETED").forEach((p: any) => {
      const mk = toMonthKey(p.createdAt);
      if (monthlyRevenueMap[mk] !== undefined) {
        monthlyRevenueMap[mk] += p.amount || 0;
      }
    });

    participants.forEach((p: any) => {
      const mk = toMonthKey(p.createdAt);
      if (monthlyRevenueMap[mk] !== undefined) {
        monthlyRevenueMap[mk] += p.pricePaid || 0;
      }
    });

    const monthlyRevenue = months.map((m) => ({
      month: m.label,
      amount: Math.round(monthlyRevenueMap[m.key] * 100) / 100,
    }));

    // === ENGAGEMENT ===
    const totalViews = recordings.reduce((sum: number, r: any) => sum + (r.viewCount || 0), 0);
    const totalPurchases = recordingAccesses.length;
    const totalSubscriberViews = subscriberViews.length;

    // Monthly views from SubscriberView timestamps
    const monthlyViewsMap: Record<string, number> = {};
    months.forEach((m) => (monthlyViewsMap[m.key] = 0));

    subscriberViews.forEach((sv: any) => {
      const mk = toMonthKey(sv.viewedAt);
      if (monthlyViewsMap[mk] !== undefined) {
        monthlyViewsMap[mk]++;
      }
    });

    const monthlyViews = months.map((m) => ({
      month: m.label,
      views: monthlyViewsMap[m.key],
    }));

    // Top 5 recordings by views
    const recordingPurchaseCounts: Record<string, number> = {};
    recordingAccesses.forEach((ra: any) => {
      recordingPurchaseCounts[ra.recordingId] = (recordingPurchaseCounts[ra.recordingId] || 0) + 1;
    });

    const topRecordings = [...recordings]
      .sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5)
      .map((r: any) => ({
        id: r.id,
        title: r.title,
        views: r.viewCount || 0,
        purchases: recordingPurchaseCounts[r.id] || 0,
      }));

    // === CALLS ===
    const completedCalls = calls.filter((c: any) => c.status === "COMPLETED");
    const cancelledCalls = calls.filter((c: any) => c.status === "CANCELLED");
    const noShowCalls = calls.filter((c: any) => c.status === "NO_SHOW");

    const totalHours = completedCalls.reduce(
      (sum: number, c: any) => sum + (c.durationMinutes || 30) / 60,
      0
    );
    const avgCallDuration =
      completedCalls.length > 0
        ? completedCalls.reduce((sum: number, c: any) => sum + (c.durationMinutes || 30), 0) /
          completedCalls.length
        : 0;

    const monthlyCallsMap: Record<string, number> = {};
    months.forEach((m) => (monthlyCallsMap[m.key] = 0));

    completedCalls.forEach((c: any) => {
      const mk = toMonthKey(c.scheduledAt);
      if (monthlyCallsMap[mk] !== undefined) {
        monthlyCallsMap[mk]++;
      }
    });

    const monthlyCalls = months.map((m) => ({
      month: m.label,
      count: monthlyCallsMap[m.key],
    }));

    // === REVIEWS ===
    const totalReviewCount = reviews.length;
    const avgRating =
      totalReviewCount > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviewCount
        : 0;

    const helpfulReviews = reviews.filter((r: any) => r.helpfulness != null);
    const avgHelpfulness =
      helpfulReviews.length > 0
        ? helpfulReviews.reduce((sum: number, r: any) => sum + r.helpfulness, 0) / helpfulReviews.length
        : 0;

    const matchReviews = reviews.filter((r: any) => r.matchRelevance != null);
    const avgMatchRelevance =
      matchReviews.length > 0
        ? matchReviews.reduce((sum: number, r: any) => sum + r.matchRelevance, 0) / matchReviews.length
        : 0;

    const ratingDistribution = [1, 2, 3, 4, 5].map((stars) => ({
      stars,
      count: reviews.filter((r: any) => r.rating === stars).length,
    }));

    const monthlyReviewsMap: Record<string, { count: number; total: number }> = {};
    months.forEach((m) => (monthlyReviewsMap[m.key] = { count: 0, total: 0 }));

    reviews.forEach((r: any) => {
      const mk = toMonthKey(r.createdAt);
      if (monthlyReviewsMap[mk] !== undefined) {
        monthlyReviewsMap[mk].count++;
        monthlyReviewsMap[mk].total += r.rating;
      }
    });

    const monthlyReviews = months.map((m) => ({
      month: m.label,
      count: monthlyReviewsMap[m.key].count,
      avgRating:
        monthlyReviewsMap[m.key].count > 0
          ? Math.round((monthlyReviewsMap[m.key].total / monthlyReviewsMap[m.key].count) * 10) / 10
          : 0,
    }));

    // === CONTENT ===
    const publishedRecordings = recordings.filter((r: any) => r.status === "PUBLISHED").length;
    const draftRecordings = recordings.filter((r: any) => r.status === "DRAFT").length;
    const pendingRecordings = recordings.filter((r: any) => r.status === "PENDING_REVIEW").length;

    const publishedSeries = seriesList.filter((s: any) => s.status === "PUBLISHED").length;

    const upcomingGroupSessions = groupSessions.filter(
      (s: any) => s.status === "SCHEDULED" || s.status === "CONFIRMED"
    ).length;
    const completedGroupSessions = groupSessions.filter(
      (s: any) => s.status === "COMPLETED"
    ).length;

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    recordings.forEach((r: any) => {
      const cat = r.category || "UNCATEGORIZED";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      revenue: {
        totalEarnings: Math.round((callEarnings + recordingPayouts + groupSessionEarnings) * 100) / 100,
        callEarnings: Math.round(callEarnings * 100) / 100,
        recordingEarnings: Math.round(recordingPayouts * 100) / 100,
        groupSessionEarnings: Math.round(groupSessionEarnings * 100) / 100,
        monthlyRevenue,
      },
      engagement: {
        totalViews,
        totalPurchases,
        totalSubscriberViews,
        monthlyViews,
        topRecordings,
      },
      calls: {
        totalCompleted: completedCalls.length,
        totalCancelled: cancelledCalls.length,
        totalNoShow: noShowCalls.length,
        totalHours: Math.round(totalHours * 10) / 10,
        avgCallDuration: Math.round(avgCallDuration),
        monthlyCalls,
      },
      reviews: {
        totalCount: totalReviewCount,
        avgRating: Math.round(avgRating * 10) / 10,
        avgHelpfulness: Math.round(avgHelpfulness * 10) / 10,
        avgMatchRelevance: Math.round(avgMatchRelevance * 10) / 10,
        ratingDistribution,
        monthlyReviews,
      },
      content: {
        recordings: {
          total: recordings.length,
          published: publishedRecordings,
          draft: draftRecordings,
          pending: pendingRecordings,
        },
        series: {
          total: seriesList.length,
          published: publishedSeries,
        },
        groupSessions: {
          total: groupSessions.length,
          upcoming: upcomingGroupSessions,
          completed: completedGroupSessions,
        },
        recommendations: recommendationsList.length,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching contributor analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
