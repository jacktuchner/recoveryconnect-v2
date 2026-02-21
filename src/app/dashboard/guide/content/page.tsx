"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import RecordingsSection from "@/components/guide/RecordingsSection";
import SeriesSection from "@/components/guide/SeriesSection";
import GroupSessionsSection from "@/components/guide/GroupSessionsSection";
import RecommendationsSection from "@/components/guide/RecommendationsSection";

export default function ContributorContentPage() {
  const { data: session } = useSession();
  const [recordings, setRecordings] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [groupSessions, setGroupSessions] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const contributorStatus = (session?.user as any)?.contributorStatus;
  const role = (session?.user as any)?.role;
  const isApproved = contributorStatus === "APPROVED" || role === "ADMIN";

  useEffect(() => {
    if (!session?.user) return;
    if (!isApproved) { setLoading(false); return; }
    const userId = (session.user as any).id;
    async function load() {
      try {
        const [recRes, seriesRes, gsRes, recsRes, profileRes] = await Promise.all([
          fetch("/api/recordings/mine"),
          fetch(`/api/series?contributorId=${userId}`),
          fetch(`/api/group-sessions?contributorId=${userId}`),
          fetch("/api/recommendations/mine"),
          fetch("/api/profile"),
        ]);
        if (recRes.ok) setRecordings(await recRes.json());
        if (seriesRes.ok) {
          const seriesData = await seriesRes.json();
          setSeries(seriesData.series || []);
        }
        if (gsRes.ok) setGroupSessions(await gsRes.json());
        if (recsRes.ok) setRecommendations(await recsRes.json());
        if (profileRes.ok) setProfile(await profileRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session, isApproved]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isApproved) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <svg className="w-12 h-12 text-amber-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-lg font-bold text-amber-800 mb-2">Content Creation Locked</h2>
        <p className="text-amber-700 text-sm max-w-md mx-auto">
          {contributorStatus === "PENDING_REVIEW"
            ? "Your application is under review. Once approved, you'll be able to create recordings, series, group sessions, and recommendations."
            : (
              <>
                You need to be an approved guide to create content.{" "}
                <Link href="/guide-application" className="text-teal-600 hover:text-teal-700 font-medium underline">
                  Complete your application
                </Link>{" "}
                to get started.
              </>
            )}
        </p>
      </div>
    );
  }

  return (
    <>
      <RecordingsSection
        recordings={recordings}
        onRecordingsUpdate={setRecordings}
      />

      <SeriesSection
        series={series}
        onSeriesUpdate={setSeries}
      />

      <GroupSessionsSection
        sessions={groupSessions}
        contributorProcedures={profile?.procedureTypes || []}
        onSessionsUpdate={setGroupSessions}
      />

      <RecommendationsSection
        recommendations={recommendations}
        contributorProcedures={profile?.procedureTypes || []}
        onRecommendationsUpdate={setRecommendations}
      />
    </>
  );
}
