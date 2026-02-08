"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StripeConnectSetup from "@/components/StripeConnectSetup";
import AvailabilityManager from "@/components/AvailabilityManager";
import ProceduresSection from "@/components/contributor/ProceduresSection";
import SharedProfileSection from "@/components/contributor/SharedProfileSection";
import BioIntroVideoSection from "@/components/contributor/BioIntroVideoSection";
import PrivacySettingsSection from "@/components/contributor/PrivacySettingsSection";
import RecordingsSection from "@/components/contributor/RecordingsSection";
import SeriesSection from "@/components/contributor/SeriesSection";
import CallRequestsSection from "@/components/contributor/CallRequestsSection";
import EarningsOverview from "@/components/contributor/EarningsOverview";
import GroupSessionsSection from "@/components/contributor/GroupSessionsSection";
import RecommendationsSection from "@/components/contributor/RecommendationsSection";
import PurchaseHistory from "@/components/PurchaseHistory";

export default function ContributorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [groupSessions, setGroupSessions] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [reviewsReceived, setReviewsReceived] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradingRole, setUpgradingRole] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const [sharedForm, setSharedForm] = useState({
    ageRange: "",
    activityLevel: "RECREATIONAL",
    hourlyRate: 50,
    isAvailableForCalls: false,
  });

  const [bio, setBio] = useState("");
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null);
  const [introVideoDuration, setIntroVideoDuration] = useState<number | null>(null);
  const [privacySettings, setPrivacySettings] = useState({ showRealName: true, displayName: "" });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user) return;
    const userId = (session.user as any).id;
    async function load() {
      try {
        const [profileRes, callsRes, settingsRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/calls"),
          fetch("/api/user/settings"),
        ]);
        if (profileRes.ok) {
          const p = await profileRes.json();
          if (p) {
            setProfile(p);
            setSharedForm({
              ageRange: p.ageRange || "",
              activityLevel: p.activityLevel || "RECREATIONAL",
              hourlyRate: p.hourlyRate || 50,
              isAvailableForCalls: p.isAvailableForCalls || false,
            });
            setIntroVideoUrl(p.introVideoUrl || null);
            setIntroVideoDuration(p.introVideoDuration || null);
            const [recRes, seriesRes, gsRes, recsRes, revRes] = await Promise.all([
              fetch("/api/recordings/mine"),
              fetch(`/api/series?contributorId=${userId}`),
              fetch(`/api/group-sessions?contributorId=${userId}`),
              fetch("/api/recommendations/mine"),
              fetch(`/api/reviews?subjectId=${userId}`),
            ]);
            if (recRes.ok) setRecordings(await recRes.json());
            if (seriesRes.ok) {
              const seriesData = await seriesRes.json();
              setSeries(seriesData.series || []);
            }
            if (gsRes.ok) setGroupSessions(await gsRes.json());
            if (recsRes.ok) setRecommendations(await recsRes.json());
            if (revRes.ok) setReviewsReceived(await revRes.json());
          }
        }
        if (callsRes.ok) setCalls(await callsRes.json());
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setPrivacySettings({
            showRealName: settings.showRealName ?? true,
            displayName: settings.displayName || "",
          });
          setBio(settings.bio || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  if (status === "loading" || loading) {
    return <div className="max-w-5xl mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Contributor Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome, {session?.user?.name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Recordings</p>
          <p className="text-2xl font-bold text-teal-700">{recordings.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Views</p>
          <p className="text-2xl font-bold text-teal-700">{recordings.reduce((a, r) => a + (r.viewCount || 0), 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Calls Completed</p>
          <p className="text-2xl font-bold text-teal-700">{calls.filter((c) => c.status === "COMPLETED").length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending Calls</p>
          <p className="text-2xl font-bold text-yellow-600">{calls.filter((c) => c.status === "REQUESTED").length}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Group Sessions</p>
          <p className="text-2xl font-bold text-teal-700">{groupSessions.filter((s: any) => s.status === "SCHEDULED" || s.status === "CONFIRMED").length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Avg Rating</p>
          <p className="text-2xl font-bold text-yellow-600">
            {reviewsReceived.length > 0
              ? (reviewsReceived.reduce((a: number, r: any) => a + r.rating, 0) / reviewsReceived.length).toFixed(1)
              : "-"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Reviews</p>
          <p className="text-2xl font-bold text-teal-700">{reviewsReceived.length}</p>
        </div>
      </div>

      <ProceduresSection
        profile={profile}
        sharedForm={sharedForm}
        onProfileUpdate={(updated) => setProfile(updated)}
      />

      <SharedProfileSection
        profile={profile}
        sharedForm={sharedForm}
        onSharedFormChange={setSharedForm}
        onProfileUpdate={(updated) => setProfile(updated)}
      />

      <BioIntroVideoSection
        profile={profile}
        sharedForm={sharedForm}
        initialBio={bio}
        initialIntroVideoUrl={introVideoUrl}
        initialIntroVideoDuration={introVideoDuration}
        onProfileUpdate={(updated) => setProfile(updated)}
      />

      <PrivacySettingsSection
        userName={session?.user?.name}
        initialSettings={privacySettings}
      />

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

      {(profile?.isAvailableForCalls || sharedForm.isAvailableForCalls) && (
        <section className="mb-8">
          <AvailabilityManager />
        </section>
      )}

      <section className="mb-8">
        <StripeConnectSetup />
      </section>

      <EarningsOverview />

      <PurchaseHistory role="contributor" />

      <CallRequestsSection
        calls={calls}
        onCallUpdate={(callId, updated) => {
          setCalls((prev) => prev.map((c) => (c.id === callId ? updated : c)));
        }}
      />

      {/* Reviews Received */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Reviews Received ({reviewsReceived.length})</h2>
        {reviewsReceived.length === 0 ? (
          <p className="text-gray-400 text-sm">No reviews received yet.</p>
        ) : (
          <div className="space-y-4">
            {reviewsReceived.slice(0, 10).map((r: any) => (
              <div key={r.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{r.author?.name || "Anonymous"}</span>
                  <span className="text-yellow-500 text-sm">
                    {"\u2605".repeat(r.rating)}{"\u2606".repeat(5 - r.rating)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.callId ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                  }`}>
                    {r.callId ? "Call" : "Recording"}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
            {reviewsReceived.length > 10 && (
              <p className="text-sm text-gray-500 text-center">
                Showing 10 of {reviewsReceived.length} reviews
              </p>
            )}
          </div>
        )}
      </section>

      {/* Upgrade to Patient Access */}
      {(session?.user as any)?.role === "CONTRIBUTOR" && (
        <section className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-teal-200 p-6 mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Need guidance for a new surgery?</h2>
              <p className="text-sm text-gray-600 mt-1">Get access to patient features like watching recovery stories and booking mentors.</p>
            </div>
            {upgradeSuccess ? (
              <div className="flex flex-col items-start sm:items-end gap-2">
                <span className="text-sm text-green-700 font-medium">Role upgraded successfully!</span>
                <button onClick={() => signOut()} className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium">Sign out to apply changes</button>
              </div>
            ) : (
              <div className="flex flex-col items-start sm:items-end gap-2">
                {upgradeError && <span className="text-sm text-red-600">{upgradeError}</span>}
                <button
                  onClick={async () => {
                    setUpgradingRole(true);
                    setUpgradeError(null);
                    try {
                      const res = await fetch("/api/user/upgrade-role", { method: "POST" });
                      if (res.ok) {
                        setUpgradeSuccess(true);
                      } else {
                        const data = await res.json();
                        setUpgradeError(data.error || "Failed to upgrade role");
                      }
                    } catch {
                      setUpgradeError("Failed to upgrade role");
                    } finally {
                      setUpgradingRole(false);
                    }
                  }}
                  disabled={upgradingRole}
                  className="text-sm bg-white text-teal-700 border border-teal-300 px-4 py-2 rounded-lg hover:bg-teal-50 font-medium disabled:opacity-50"
                >
                  {upgradingRole ? "Upgrading..." : "Get Patient Access"}
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
