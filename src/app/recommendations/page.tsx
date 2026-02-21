"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PROCEDURE_TYPES, RECOMMENDATION_CATEGORIES } from "@/lib/constants";

interface Recommendation {
  id: string;
  name: string;
  category: string;
  procedureType: string;
  description?: string;
  location?: string;
  priceRange?: string;
  endorsementCount: number;
  helpfulCount: number;
  hasVoted: boolean;
  endorsements: {
    id: string;
    contributor: { id: string; name: string; image?: string };
  }[];
}

interface PaginationInfo {
  page: number;
  total: number;
  totalPages: number;
}

export default function RecommendationsPage() {
  const { data: session, status } = useSession();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);

  const [procedure, setProcedure] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("most_recommended");

  const userRole = (session?.user as any)?.role;
  const isContributor = userRole === "GUIDE" || userRole === "BOTH" || userRole === "ADMIN";
  const isSubscriber = (session?.user as any)?.subscriptionStatus === "active";
  const hasAccess = isContributor || isSubscriber;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (procedure) params.set("procedure", procedure);
        if (category) params.set("category", category);
        if (sort) params.set("sort", sort);
        if (search) params.set("search", search);
        params.set("page", String(page));

        const res = await fetch(`/api/recommendations?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations);
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [procedure, category, sort, search, page]);

  async function toggleVote(e: React.MouseEvent, recId: string) {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) return;
    setVotingId(recId);
    try {
      const res = await fetch(`/api/recommendations/${recId}/vote`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setRecommendations((prev) =>
          prev.map((r) =>
            r.id === recId
              ? { ...r, hasVoted: data.voted, helpfulCount: data.helpfulCount }
              : r
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVotingId(null);
    }
  }

  const categoryLabel = (value: string) =>
    RECOMMENDATION_CATEGORIES.find((c) => c.value === value)?.label || value;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Recovery Recommendations</h1>
          <p className="text-teal-100 text-lg max-w-2xl">
            Products, providers, and resources recommended by recovery mentors who&apos;ve been through the same procedure.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subscription gate */}
        {status !== "loading" && !hasAccess && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-teal-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Subscriber-Only Feature</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Recovery recommendations from mentors are available exclusively to subscribers.
              Get unlimited access to recommendations, recordings, and more.
            </p>
            <Link
              href="/how-it-works#pricing"
              className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 font-medium inline-block"
            >
              View Subscription Plans
            </Link>
          </div>
        )}

        {hasAccess && <>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <select
            value={procedure}
            onChange={(e) => { setProcedure(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">All Procedures</option>
            {PROCEDURE_TYPES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">All Categories</option>
            {RECOMMENDATION_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="most_recommended">Most Recommended</option>
            <option value="most_helpful">Most Helpful</option>
            <option value="newest">Newest</option>
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search recommendations..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white flex-1 min-w-[200px]"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No recommendations found</h3>
            <p className="text-gray-500">
              {procedure || category || search
                ? "Try adjusting your filters to see more results."
                : "Check back soon for recommendations from recovery mentors."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/recommendations/${rec.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                      {categoryLabel(rec.category)}
                    </span>
                    {rec.priceRange && (
                      <span className="text-sm font-semibold text-gray-900">
                        {rec.priceRange}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{rec.name}</h3>

                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full inline-block mb-2">
                    {rec.procedureType}
                  </span>

                  {rec.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{rec.description}</p>
                  )}

                  {rec.location && (
                    <p className="text-sm text-gray-500 mb-2">
                      <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {rec.location}
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-teal-600">{rec.endorsementCount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        {rec.helpfulCount}
                      </span>
                    </div>
                    {session?.user && (
                      <button
                        onClick={(e) => toggleVote(e, rec.id)}
                        disabled={votingId === rec.id}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                          rec.hasVoted
                            ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        } disabled:opacity-50`}
                      >
                        {rec.hasVoted ? "Helpful" : "Helpful?"}
                      </button>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
        </>}
      </div>
    </div>
  );
}
