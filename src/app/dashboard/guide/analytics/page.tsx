"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AnalyticsData {
  revenue: {
    totalEarnings: number;
    callEarnings: number;
    recordingEarnings: number;
    groupSessionEarnings: number;
    monthlyRevenue: { month: string; amount: number }[];
  };
  engagement: {
    totalViews: number;
    totalPurchases: number;
    totalSubscriberViews: number;
    monthlyViews: { month: string; views: number }[];
    topRecordings: { id: string; title: string; views: number; purchases: number }[];
  };
  calls: {
    totalCompleted: number;
    totalCancelled: number;
    totalNoShow: number;
    totalHours: number;
    avgCallDuration: number;
    monthlyCalls: { month: string; count: number }[];
  };
  reviews: {
    totalCount: number;
    avgRating: number;
    avgHelpfulness: number;
    avgMatchRelevance: number;
    ratingDistribution: { stars: number; count: number }[];
    monthlyReviews: { month: string; count: number; avgRating: number }[];
  };
  content: {
    recordings: { total: number; published: number; draft: number; pending: number };
    series: { total: number; published: number };
    groupSessions: { total: number; upcoming: number; completed: number };
    recommendations: number;
    categoryBreakdown: { category: string; count: number }[];
  };
}

function StatCard({ label, value, subtext, color = "teal" }: {
  label: string;
  value: string | number;
  subtext?: string;
  color?: "teal" | "yellow" | "green" | "purple" | "cyan" | "red";
}) {
  const colorMap = {
    teal: "text-teal-700",
    yellow: "text-yellow-600",
    green: "text-green-600",
    purple: "text-purple-600",
    cyan: "text-cyan-600",
    red: "text-red-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}

function BarChart({ data, valueKey, labelKey, color = "#0d9488", prefix = "" }: {
  data: Record<string, any>[];
  valueKey: string;
  labelKey: string;
  color?: string;
  prefix?: string;
}) {
  const maxVal = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d, i) => {
        const pct = (d[valueKey] / maxVal) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-600 font-medium">
              {prefix}{typeof d[valueKey] === "number" && d[valueKey] % 1 !== 0
                ? d[valueKey].toFixed(2)
                : d[valueKey]}
            </span>
            <div
              className="w-full rounded-t-md transition-all duration-300"
              style={{
                height: `${Math.max(pct, 2)}%`,
                backgroundColor: color,
                minHeight: "4px",
              }}
            />
            <span className="text-xs text-gray-500 whitespace-nowrap">{d[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

function LineChart({ data, valueKey, labelKey, color = "#0d9488" }: {
  data: Record<string, any>[];
  valueKey: string;
  labelKey: string;
  color?: string;
}) {
  const maxVal = Math.max(...data.map((d) => d[valueKey]), 1);
  const padding = 30;
  const width = 400;
  const height = 150;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const points = data.map((d, i) => ({
    x: padding + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding + chartH - (d[valueKey] / maxVal) * chartH,
    value: d[valueKey],
    label: d[labelKey],
  }));

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <line
          key={pct}
          x1={padding}
          y1={padding + chartH * (1 - pct)}
          x2={width - padding}
          y2={padding + chartH * (1 - pct)}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}
      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots and labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={color} />
          <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[10px]" fill="#4b5563">
            {p.value}
          </text>
          <text x={p.x} y={height - 5} textAnchor="middle" className="text-[10px]" fill="#9ca3af">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function RatingDistribution({ data }: { data: { stars: number; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2">
      {[...data].reverse().map((d) => (
        <div key={d.stars} className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-8">{d.stars}{"\u2605"}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all duration-300"
              style={{ width: `${(d.count / maxCount) * 100}%`, minWidth: d.count > 0 ? "8px" : "0" }}
            />
          </div>
          <span className="text-sm text-gray-500 w-8 text-right">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function formatCategory(cat: string): string {
  return cat
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ContributorAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user) return;
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/guide/analytics");
        if (!res.ok) {
          if (res.status === 403) {
            router.push("/dashboard");
            return;
          }
          throw new Error("Failed to load analytics");
        }
        setAnalytics(await res.json());
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [session, router]);

  if (status === "loading" || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-20" />
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-64" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-red-600">{error}</p>
        <Link href="/dashboard/guide" className="text-teal-600 hover:text-teal-700 text-sm mt-2 inline-block">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!analytics) return null;

  const { revenue, engagement, calls, reviews, content } = analytics;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/dashboard/guide"
            className="text-sm text-teal-600 hover:text-teal-700 font-medium mb-2 inline-block"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600 mt-1">Track your performance and growth</p>
        </div>
      </div>

      {/* === REVENUE SECTION === */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Revenue</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <StatCard label="Total Earnings" value={`$${revenue.totalEarnings.toFixed(2)}`} color="green" />
          <StatCard label="Call Earnings" value={`$${revenue.callEarnings.toFixed(2)}`} color="teal" />
          <StatCard label="Group Session Earnings" value={`$${revenue.groupSessionEarnings.toFixed(2)}`} color="cyan" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue (Last 6 Months)</h3>
          <BarChart data={revenue.monthlyRevenue} valueKey="amount" labelKey="month" color="#059669" prefix="$" />
        </div>
      </section>

      {/* === ENGAGEMENT SECTION === */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Engagement</h2>
        <div className="grid grid-cols-1 gap-4 mb-4">
          <StatCard label="Total Views" value={engagement.totalViews.toLocaleString()} color="teal" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Views</h3>
            <LineChart data={engagement.monthlyViews} valueKey="views" labelKey="month" color="#0d9488" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Recordings</h3>
            {engagement.topRecordings.length === 0 ? (
              <p className="text-gray-400 text-sm">No recordings yet.</p>
            ) : (
              <div className="space-y-3">
                {engagement.topRecordings.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                      <p className="text-xs text-gray-500">
                        {r.views.toLocaleString()} views
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* === CALLS SECTION === */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Calls</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <StatCard label="Completed" value={calls.totalCompleted} color="green" />
          <StatCard label="Cancelled" value={calls.totalCancelled} color="yellow" />
          <StatCard label="No-Show" value={calls.totalNoShow} color="red" />
          <StatCard label="Total Hours" value={calls.totalHours} color="teal" />
          <StatCard label="Avg Duration" value={`${calls.avgCallDuration} min`} color="cyan" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Completed Calls</h3>
          <BarChart data={calls.monthlyCalls} valueKey="count" labelKey="month" color="#0d9488" />
        </div>
      </section>

      {/* === REVIEWS SECTION === */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Reviews</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Total Reviews" value={reviews.totalCount} color="teal" />
          <StatCard label="Avg Rating" value={reviews.avgRating > 0 ? `${reviews.avgRating}/5` : "-"} color="yellow" />
          <StatCard label="Avg Helpfulness" value={reviews.avgHelpfulness > 0 ? `${reviews.avgHelpfulness}/5` : "-"} color="green" />
          <StatCard label="Avg Match Relevance" value={reviews.avgMatchRelevance > 0 ? `${reviews.avgMatchRelevance}/5` : "-"} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Rating Distribution</h3>
            <RatingDistribution data={reviews.ratingDistribution} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Reviews</h3>
            <BarChart data={reviews.monthlyReviews} valueKey="count" labelKey="month" color="#eab308" />
          </div>
        </div>
      </section>

      {/* === CONTENT SECTION === */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Content</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard
            label="Recordings"
            value={content.recordings.total}
            subtext={`${content.recordings.published} published, ${content.recordings.draft} draft${content.recordings.pending > 0 ? `, ${content.recordings.pending} pending` : ""}`}
            color="teal"
          />
          <StatCard
            label="Series"
            value={content.series.total}
            subtext={`${content.series.published} published`}
            color="purple"
          />
          <StatCard
            label="Group Sessions"
            value={content.groupSessions.total}
            subtext={`${content.groupSessions.upcoming} upcoming, ${content.groupSessions.completed} completed`}
            color="cyan"
          />
          <StatCard
            label="Recommendations"
            value={content.recommendations}
            color="green"
          />
        </div>

        {content.categoryBreakdown.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Recording Categories</h3>
            <div className="space-y-2">
              {content.categoryBreakdown.map((cat) => {
                const pct = content.recordings.total > 0
                  ? (cat.count / content.recordings.total) * 100
                  : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-40 truncate">{formatCategory(cat.category)}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-500 transition-all duration-300"
                        style={{ width: `${pct}%`, minWidth: cat.count > 0 ? "8px" : "0" }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8 text-right">{cat.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
