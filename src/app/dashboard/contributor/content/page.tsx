"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import RecordingsSection from "@/components/contributor/RecordingsSection";
import SeriesSection from "@/components/contributor/SeriesSection";
import GroupSessionsSection from "@/components/contributor/GroupSessionsSection";
import RecommendationsSection from "@/components/contributor/RecommendationsSection";

export default function ContributorContentPage() {
  const { data: session } = useSession();
  const [recordings, setRecordings] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [groupSessions, setGroupSessions] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
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
  }, [session]);

  if (loading) {
    return <div>Loading...</div>;
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
