"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import FilterSidebar from "@/components/FilterSidebar";
import ContentAcknowledgmentModal from "@/components/ContentAcknowledgmentModal";
import DisclaimerBanner from "@/components/DisclaimerBanner";

const activityLabels: Record<string, string> = {
  SEDENTARY: "Sedentary",
  RECREATIONAL: "Recreational",
  COMPETITIVE_ATHLETE: "Competitive Athlete",
  PROFESSIONAL_ATHLETE: "Professional Athlete",
};

interface Contributor {
  id: string;
  name: string;
  bio?: string;
  profile?: {
    procedureType?: string;
    ageRange?: string;
    activityLevel?: string;
    recoveryGoals?: string[];
    timeSinceSurgery?: string;
    hourlyRate?: number;
    isAvailableForCalls?: boolean;
  };
  reviewsReceived?: { rating: number }[];
  matchScore?: number;
  matchBreakdown?: { attribute: string; matched: boolean; weight: number }[];
}

function MatchScoreTooltip({ breakdown }: { breakdown: { attribute: string; matched: boolean; weight: number }[] }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.preventDefault(); setShow(!show); }}
        className="ml-1 text-gray-400 hover:text-gray-600"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {show && (
        <div className="absolute right-0 top-6 z-50 w-56 bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-left">
          <p className="text-xs font-medium text-gray-700 mb-2">Match breakdown:</p>
          <div className="space-y-1">
            {breakdown.map((item) => (
              <div key={item.attribute} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{item.attribute}</span>
                <span className={item.matched ? "text-green-600" : "text-gray-400"}>
                  {item.matched ? "✓" : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MentorCard({ contributor }: { contributor: Contributor }) {
  const profile = contributor.profile || {};
  const averageRating = contributor.reviewsReceived?.length
    ? contributor.reviewsReceived.reduce((a, r) => a + r.rating, 0) / contributor.reviewsReceived.length
    : undefined;
  const reviewCount = contributor.reviewsReceived?.length || 0;

  return (
    <Link href={`/contributors/${contributor.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-cyan-200 transition-all h-full">
        <div className="flex items-start gap-4 mb-4">
          {/* Profile Photo */}
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">
              {contributor.name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-cyan-700 transition-colors text-lg">
              {contributor.name}
            </h3>
            <p className="text-sm text-gray-600">{profile.procedureType || "Recovery Mentor"}</p>
            {profile.isAvailableForCalls && (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full mt-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Available for calls
              </span>
            )}
          </div>
          {contributor.matchScore !== undefined && (
            <div className="flex items-center flex-shrink-0">
              <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                contributor.matchScore >= 80 ? "bg-green-100 text-green-700" :
                contributor.matchScore >= 60 ? "bg-yellow-100 text-yellow-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {contributor.matchScore}% match
              </span>
              {contributor.matchBreakdown && (
                <MatchScoreTooltip breakdown={contributor.matchBreakdown} />
              )}
            </div>
          )}
        </div>

        {/* Bio Preview */}
        {contributor.bio && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 italic">
            &ldquo;{contributor.bio}&rdquo;
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {profile.ageRange && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{profile.ageRange}</span>
          )}
          {profile.activityLevel && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {activityLabels[profile.activityLevel] || profile.activityLevel}
            </span>
          )}
          {profile.timeSinceSurgery && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {profile.timeSinceSurgery} post-op
            </span>
          )}
        </div>

        {/* Recovery Goals */}
        {profile.recoveryGoals && profile.recoveryGoals.length > 0 && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            Goals: {profile.recoveryGoals.slice(0, 2).join(", ")}
            {profile.recoveryGoals.length > 2 && ` +${profile.recoveryGoals.length - 2} more`}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {averageRating !== undefined && reviewCount > 0 && (
              <span className="flex items-center gap-0.5">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {averageRating.toFixed(1)} ({reviewCount})
              </span>
            )}
          </div>
          {profile.isAvailableForCalls && profile.hourlyRate && (
            <span className="text-lg font-bold text-cyan-700">
              ${profile.hourlyRate}/hr
            </span>
          )}
        </div>

        {/* CTA Button */}
        {profile.isAvailableForCalls && (
          <button className="mt-4 w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Book Call - ${profile.hourlyRate}/hr
          </button>
        )}
      </div>
    </Link>
  );
}

function MentorsContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    procedure: searchParams.get("procedure") || "",
    ageRange: searchParams.get("ageRange") || "",
    activityLevel: searchParams.get("activityLevel") || "",
    category: "", // Not used for mentors but needed for FilterSidebar
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.procedure) params.set("procedure", filters.procedure);
    if (filters.ageRange) params.set("ageRange", filters.ageRange);
    if (filters.activityLevel) params.set("activityLevel", filters.activityLevel);
    params.set("availableForCalls", "true"); // Only show mentors available for calls
    params.set("page", pagination.page.toString());

    try {
      const res = await fetch(`/api/contributors?${params}`);
      const data = await res.json();
      setContributors(data.contributors || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error("Error fetching contributors:", err);
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
        {/* Hero Section - Blue/Cyan Gradient */}
        <div className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex items-center gap-4 mb-4">
              {/* Video Camera Icon */}
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold">Talk to Someone Who Gets It</h1>
            </div>
            <p className="text-lg sm:text-xl text-cyan-100 max-w-2xl">
              Book a 1-on-1 video call. Ask questions, get real-time advice from someone who&apos;s been there.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm bg-white/10 px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Real people, real experience
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm bg-white/10 px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Book on your schedule
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm bg-white/10 px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ask anything
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Disclaimer Banner */}
          <DisclaimerBanner dismissible />

          {/* Looking for recordings CTA */}
          <div className="mb-8 p-4 bg-teal-50 border border-teal-200 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-teal-900">Prefer to learn at your own pace?</p>
                <p className="text-sm text-teal-700">Browse recorded recovery stories you can watch anytime.</p>
              </div>
              <Link
                href="/watch"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Stories
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
                placeholder="Search mentors by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
                <h2 className="font-semibold text-gray-900 mb-4">Find Your Mentor</h2>
                <FilterSidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  showCategory={false}
                />
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1">
              {/* Results count */}
              {!loading && (
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery
                    ? `${contributors.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length} mentor${contributors.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length !== 1 ? "s" : ""} found`
                    : `${pagination.total} mentor${pagination.total !== 1 ? "s" : ""} available`
                  }
                </p>
              )}

              {loading ? (
                <div className="grid sm:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />
                  ))}
                </div>
              ) : contributors.filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500 text-lg mb-2">No mentors found</p>
                  <p className="text-gray-400 text-sm">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {contributors
                    .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((c) => (
                      <MentorCard key={c.id} contributor={c} />
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

export default function MentorsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8">Loading...</div>}>
      <MentorsContent />
    </Suspense>
  );
}
