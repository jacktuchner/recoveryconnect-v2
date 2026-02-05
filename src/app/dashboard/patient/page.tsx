"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PROCEDURE_TYPES, AGE_RANGES, ACTIVITY_LEVELS, RECOVERY_GOALS, COMPLICATING_FACTORS, LIFESTYLE_CONTEXTS } from "@/lib/constants";
import RecoveryTimeline from "@/components/RecoveryTimeline";
import ProfileWizard from "@/components/ProfileWizard";

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    procedureType: "",
    procedureDetails: "",
    ageRange: "",
    activityLevel: "RECREATIONAL",
    recoveryGoals: [] as string[],
    complicatingFactors: [] as string[],
    lifestyleContext: [] as string[],
  });

  const [privacySettings, setPrivacySettings] = useState({
    showRealName: true,
    displayName: "",
  });
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user) return;
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
            setForm({
              procedureType: p.procedureType || "",
              procedureDetails: p.procedureDetails || "",
              ageRange: p.ageRange || "",
              activityLevel: p.activityLevel || "RECREATIONAL",
              recoveryGoals: p.recoveryGoals || [],
              complicatingFactors: p.complicatingFactors || [],
              lifestyleContext: p.lifestyleContext || [],
            });
          } else {
            // No profile yet - show wizard for new users
            setShowWizard(true);
          }
        }
        if (callsRes.ok) setCalls(await callsRes.json());
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setPrivacySettings({
            showRealName: settings.showRealName ?? true,
            displayName: settings.displayName || "",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: profile ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleWizardComplete(data: any) {
    try {
      const res = await fetch("/api/profile", {
        method: profile ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const savedProfile = await res.json();
        setProfile(savedProfile);
        setForm(data);
        setShowWizard(false);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  function toggleArrayItem(key: "recoveryGoals" | "complicatingFactors" | "lifestyleContext", value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  }

  async function savePrivacySettings() {
    setSavingPrivacy(true);
    setPrivacySaved(false);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(privacySettings),
      });
      if (res.ok) {
        setPrivacySaved(true);
        setTimeout(() => setPrivacySaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPrivacy(false);
    }
  }

  async function cancelCall(callId: string) {
    if (!confirm("Are you sure you want to cancel this call?")) return;

    try {
      const res = await fetch(`/api/calls/${callId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCalls((prev) => prev.map((c) => (c.id === callId ? updated : c)));
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (status === "loading" || loading) {
    return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;
  }

  // Show wizard for new users or when explicitly requested
  if (showWizard) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to RecoveryConnect</h1>
          <p className="text-gray-600 mt-1">Let&apos;s set up your profile to find the best matches.</p>
        </div>
        <ProfileWizard
          initialData={profile ? {
            procedureType: profile.procedureType,
            procedureDetails: profile.procedureDetails,
            ageRange: profile.ageRange,
            activityLevel: profile.activityLevel,
            recoveryGoals: profile.recoveryGoals,
            complicatingFactors: profile.complicatingFactors,
            lifestyleContext: profile.lifestyleContext,
          } : undefined}
          onComplete={handleWizardComplete}
          onCancel={profile ? () => setShowWizard(false) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Patient Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome, {session?.user?.name}</p>
        </div>
        <Link
          href="/watch"
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
        >
          Watch Stories
        </Link>
      </div>

      {/* Profile Section */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Your Recovery Profile</h2>
          {profile && !editing && (
            <div className="flex gap-2">
              <button onClick={() => setShowWizard(true)} className="text-sm text-gray-500 hover:text-gray-700">
                Use Wizard
              </button>
              <button onClick={() => setEditing(true)} className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                Quick Edit
              </button>
            </div>
          )}
        </div>

        {!profile && !editing ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Complete your profile to get matched with relevant content and contributors.</p>
            <button onClick={() => setShowWizard(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
              Set Up Profile
            </button>
          </div>
        ) : editing ? (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Type *</label>
                <select value={form.procedureType} onChange={(e) => setForm(f => ({...f, procedureType: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select procedure</option>
                  {PROCEDURE_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Details</label>
                <input type="text" value={form.procedureDetails} onChange={(e) => setForm(f => ({...f, procedureDetails: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., Patellar tendon graft" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Range *</label>
                <select value={form.ageRange} onChange={(e) => setForm(f => ({...f, ageRange: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select age range</option>
                  {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level *</label>
                <select value={form.activityLevel} onChange={(e) => setForm(f => ({...f, activityLevel: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {ACTIVITY_LEVELS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recovery Goals</label>
              <div className="flex flex-wrap gap-2">
                {RECOVERY_GOALS.map(g => (
                  <button key={g} type="button" onClick={() => toggleArrayItem("recoveryGoals", g)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.recoveryGoals.includes(g) ? "bg-teal-50 border-teal-300 text-teal-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>{g}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Complicating Factors</label>
              <div className="flex flex-wrap gap-2">
                {COMPLICATING_FACTORS.map(f => (
                  <button key={f} type="button" onClick={() => toggleArrayItem("complicatingFactors", f)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.complicatingFactors.includes(f) ? "bg-orange-50 border-orange-300 text-orange-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>{f}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lifestyle Context</label>
              <div className="flex flex-wrap gap-2">
                {LIFESTYLE_CONTEXTS.map(l => (
                  <button key={l} type="button" onClick={() => toggleArrayItem("lifestyleContext", l)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.lifestyleContext.includes(l) ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>{l}</button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={saveProfile} disabled={saving || !form.procedureType || !form.ageRange}
                className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium">
                {saving ? "Saving..." : "Save Profile"}
              </button>
              {profile && (
                <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Procedure</p>
                <p className="font-medium">{profile.procedureType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Age Range</p>
                <p className="font-medium">{profile.ageRange}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Activity Level</p>
                <p className="font-medium">{profile.activityLevel.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}</p>
              </div>
            </div>
            {profile.recoveryGoals?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Recovery Goals</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.recoveryGoals.map((g: string) => (
                    <span key={g} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{g}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.complicatingFactors?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Complicating Factors</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.complicatingFactors.map((f: string) => (
                    <span key={f} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.lifestyleContext?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Lifestyle Context</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.lifestyleContext.map((l: string) => (
                    <span key={l} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Privacy Settings */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Privacy Settings</h2>
        <p className="text-sm text-gray-600 mb-4">
          Control how your name appears when you leave reviews or interact on the platform.
        </p>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privacySettings.showRealName}
              onChange={(e) => setPrivacySettings((prev) => ({ ...prev, showRealName: e.target.checked }))}
              className="mt-1 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <div>
              <span className="font-medium text-gray-900">Show my real name publicly</span>
              <p className="text-sm text-gray-500">
                When enabled, your real name ({session?.user?.name}) will be visible on reviews you write.
              </p>
            </div>
          </label>

          {!privacySettings.showRealName && (
            <div className="ml-7">
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={privacySettings.displayName}
                onChange={(e) => setPrivacySettings((prev) => ({ ...prev, displayName: e.target.value }))}
                placeholder="e.g., RecoveryWarrior23"
                className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                This name will be shown instead of your real name. Leave blank to show as &quot;{session?.user?.name?.[0]}. (Anonymous)&quot;.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={savePrivacySettings}
              disabled={savingPrivacy}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
            >
              {savingPrivacy ? "Saving..." : "Save Privacy Settings"}
            </button>
            {privacySaved && (
              <span className="text-sm text-green-600 font-medium">Saved!</span>
            )}
          </div>
        </div>
      </section>

      {/* Recovery Timeline */}
      {profile?.procedureType && (
        <section className="mb-8">
          <RecoveryTimeline procedureType={profile.procedureType} />
        </section>
      )}

      {/* Upcoming Calls */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Your Calls</h2>
        {calls.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No calls booked yet.</p>
            <Link href="/mentors" className="text-teal-600 hover:text-teal-700 font-medium text-sm">
              Find a mentor to book a call
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call: any) => (
              <div key={call.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{call.contributor?.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(call.scheduledAt).toLocaleDateString()} at{" "}
                    {new Date(call.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" "}&middot; {call.durationMinutes} min
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(call.status === "REQUESTED" || call.status === "CONFIRMED") && (
                    <button
                      onClick={() => cancelCall(call.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  )}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    call.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                    call.status === "REQUESTED" ? "bg-yellow-100 text-yellow-700" :
                    call.status === "COMPLETED" ? "bg-gray-100 text-gray-600" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {call.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
