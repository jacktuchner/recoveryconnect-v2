"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import RecordingsSection from "@/components/guide/RecordingsSection";
import SeriesSection from "@/components/guide/SeriesSection";
import GroupSessionsSection from "@/components/guide/GroupSessionsSection";
import RecommendationsSection from "@/components/guide/RecommendationsSection";
import { checkProfileCompleteness } from "@/lib/profileCompleteness";

export default function GuideContentPage() {
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

  const profileCheck = checkProfileCompleteness(profile);
  const draftSeries = series.filter((s: any) => s.status === "DRAFT");

  const recordingSeriesMap = new Map<string, { seriesId: string; seriesTitle: string }>();
  series.forEach((s: any) => {
    (s.recordings || []).forEach((rec: any) => {
      const recId = typeof rec === "string" ? rec : rec.id;
      if (recId && !recordingSeriesMap.has(recId)) {
        recordingSeriesMap.set(recId, { seriesId: s.id, seriesTitle: s.title });
      }
    });
  });

  return (
    <>
      {!profileCheck.isComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">Complete your profile to start creating content</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Missing: {profileCheck.missingFields.join(", ")}.{" "}
              <Link href="/dashboard/guide/profile" className="text-teal-600 hover:text-teal-700 font-medium underline">
                Go to profile
              </Link>
            </p>
          </div>
        </div>
      )}

      <RecordingsSection
        recordings={recordings}
        onRecordingsUpdate={setRecordings}
        profileComplete={profileCheck.isComplete}
        draftSeries={draftSeries}
        recordingSeriesMap={recordingSeriesMap}
      />

      <SeriesSection
        series={series}
        onSeriesUpdate={setSeries}
        profileComplete={profileCheck.isComplete}
        allRecordings={recordings}
        onRecordingsUpdate={setRecordings}
      />

      <GroupSessionsSection
        sessions={groupSessions}
        guideProcedures={profile?.procedureTypes || []}
        onSessionsUpdate={setGroupSessions}
      />

      <RecommendationsSection
        recommendations={recommendations}
        guideProcedures={profile?.procedureTypes || []}
        onRecommendationsUpdate={setRecommendations}
      />
    </>
  );
}
