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
import PurchaseHistory from "@/components/PurchaseHistory";

export default function ContributorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
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
            const [recRes, seriesRes] = await Promise.all([
              fetch("/api/recordings/mine"),
              fetch(`/api/series?contributorId=${userId}`),
            ]);
            if (recRes.ok) setRecordings(await recRes.json());
            if (seriesRes.ok) {
              const seriesData = await seriesRes.json();
              setSeries(seriesData.series || []);
            }
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
