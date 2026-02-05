"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import RecordingCard from "@/components/RecordingCard";
import FilterSidebar from "@/components/FilterSidebar";
import ContentAcknowledgmentModal from "@/components/ContentAcknowledgmentModal";
import DisclaimerBanner from "@/components/DisclaimerBanner";

function WatchContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    procedure: searchParams.get("procedure") || "",
    ageRange: searchParams.get("ageRange") || "",
    activityLevel: searchParams.get("activityLevel") || "",
    category: searchParams.get("category") || "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.procedure) params.set("procedure", filters.procedure);
    if (filters.ageRange) params.set("ageRange", filters.ageRange);
    if (filters.activityLevel) params.set("activityLevel", filters.activityLevel);
    if (filters.category) params.set("category", filters.category);
    params.set("page", pagination.page.toString());

    try {
      const res = await fetch(`/api/recordings?${params}`);
      const data = await res.json();
      setRecordings(data.recordings || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error("Error fetching recordings:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleFilterChange(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  return (
    <ContentAcknowledgmentModal>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section - Teal Gradient */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex items-center gap-4 mb-4">
              {/* Play Button Icon */}
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold">Watch Recovery Stories</h1>
            </div>
            <p className="text-lg sm:text-xl text-teal-100 max-w-2xl">
              Real people sharing what recovery is actually like. Buy once, watch anytime.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm bg-white/10 px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                On-demand access
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm bg-white/10 px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Matched to your situation
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm bg-white/10 px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pay per recording
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Disclaimer Banner */}
          <DisclaimerBanner dismissible />

          {/* Looking for mentors CTA */}
          <div className="mb-8 p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-cyan-900">Want to talk to someone live?</p>
                <p className="text-sm text-cyan-700">Book a 1-on-1 video call with a recovery mentor.</p>
              </div>
              <Link
                href="/mentors"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Book a Mentor
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search recordings by title or contributor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
                <h2 className="font-semibold text-gray-900 mb-4">Filter Recordings</h2>
                <FilterSidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  showCategory={true}
                />
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1">
              {/* Results count */}
              {!loading && (
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery
                    ? `${recordings.filter(r =>
                        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.contributor?.name?.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length} recording${recordings.filter(r =>
                        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.contributor?.name?.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length !== 1 ? "s" : ""} found`
                    : `${pagination.total} recording${pagination.total !== 1 ? "s" : ""} found`
                  }
                </p>
              )}

              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 h-72 animate-pulse" />
                  ))}
                </div>
              ) : recordings.filter(r =>
                  !searchQuery ||
                  r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.contributor?.name?.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 text-lg mb-2">No recordings found</p>
                  <p className="text-gray-400 text-sm">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recordings
                    .filter(r =>
                      !searchQuery ||
                      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.contributor?.name?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((rec: any) => (
                      <RecordingCard
                        key={rec.id}
                        id={rec.id}
                        title={rec.title}
                        contributorName={rec.contributor?.name || "Anonymous"}
                        procedureType={rec.procedureType}
                        ageRange={rec.ageRange}
                        activityLevel={rec.activityLevel}
                        category={rec.category}
                        durationSeconds={rec.durationSeconds}
                        isVideo={rec.isVideo}
                        price={rec.price}
                        viewCount={rec.viewCount}
                        averageRating={
                          rec.reviews?.length
                            ? rec.reviews.reduce((a: number, r: any) => a + r.rating, 0) / rec.reviews.length
                            : undefined
                        }
                        matchScore={rec.matchScore}
                        matchBreakdown={rec.matchBreakdown}
                      />
                    ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50 hover:bg-gray-50 bg-white"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50 hover:bg-gray-50 bg-white"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ContentAcknowledgmentModal>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8">Loading...</div>}>
      <WatchContent />
    </Suspense>
  );
}
