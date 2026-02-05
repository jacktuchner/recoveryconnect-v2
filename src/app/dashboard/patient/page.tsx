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
  const [showAddProcedure, setShowAddProcedure] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switchingProcedure, setSwitchingProcedure] = useState(false);

  const [form, setForm] = useState({
    procedureType: "",
    procedureDetails: "",
    ageRange: "",
    activityLevel: "RECREATIONAL",
    recoveryGoals: [] as string[],
    complicatingFactors: [] as string[],
    lifestyleContext: [] as string[],
  });

  const [newProcedure, setNewProcedure] = useState("");

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

  // Get procedures list
  const procedures = profile?.procedureTypes?.length > 0
    ? profile.procedureTypes
    : (profile?.procedureType ? [profile.procedureType] : []);

  const activeProcedure = profile?.activeProcedureType || profile?.procedureType || procedures[0];

  async function switchActiveProcedure(procedureType: string) {
    if (procedureType === activeProcedure) return;
    setSwitchingProcedure(true);
    try {
      const res = await fetch("/api/profile/active-procedure", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ procedureType }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSwitchingProcedure(false);
    }
  }

  async function addProcedure() {
    if (!newProcedure || procedures.includes(newProcedure)) return;
    setSaving(true);
    try {
      const updatedProcedures = [...procedures, newProcedure];
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          procedureTypes: updatedProcedures,
          activeProcedureType: newProcedure, // Switch to the new one
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setNewProcedure("");
        setShowAddProcedure(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function removeProcedure(procedureType: string) {
    if (procedures.length <= 1) return; // Must have at least one
    if (!confirm(`Remove ${procedureType} from your profile?`)) return;

    setSaving(true);
    try {
      const updatedProcedures = procedures.filter((p: string) => p !== procedureType);
      const newActive = procedureType === activeProcedure ? updatedProcedures[0] : activeProcedure;

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          procedureTypes: updatedProcedures,
          procedureType: updatedProcedures[0],
          activeProcedureType: newActive,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: profile ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          procedureTypes: procedures.length > 0 ? procedures : [form.procedureType],
        }),
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
        body: JSON.stringify({
          ...data,
          procedureTypes: [data.procedureType],
          activeProcedureType: data.procedureType,
        }),
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

      {/* My Procedures Section */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">My Procedures</h2>
            <p className="text-sm text-gray-500 mt-1">
              Click a procedure to make it active for matching
            </p>
          </div>
          <button
            onClick={() => setShowAddProcedure(true)}
            className="text-sm bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-100 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Procedure
          </button>
        </div>

        {/* Procedure Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          {procedures.map((proc: string) => (
            <div
              key={proc}
              onClick={() => switchActiveProcedure(proc)}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                proc === activeProcedure
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              } ${switchingProcedure ? "opacity-50 pointer-events-none" : ""}`}
            >
              {proc === activeProcedure && (
                <span className="absolute top-2 right-2 text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  proc === activeProcedure ? "bg-teal-600" : "bg-gray-100"
                }`}>
                  <svg className={`w-5 h-5 ${proc === activeProcedure ? "text-white" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${proc === activeProcedure ? "text-teal-900" : "text-gray-900"}`}>
                    {proc}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {proc === activeProcedure ? "Currently matching on this" : "Click to switch"}
                  </p>
                </div>
              </div>
              {procedures.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeProcedure(proc);
                  }}
                  className="absolute bottom-2 right-2 text-gray-400 hover:text-red-500 p-1"
                  title="Remove procedure"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Procedure Modal */}
        {showAddProcedure && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="font-medium text-gray-900 mb-3">Add Another Procedure</h3>
            <div className="flex gap-3">
              <select
                value={newProcedure}
                onChange={(e) => setNewProcedure(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select a procedure...</option>
                {PROCEDURE_TYPES.filter(p => !procedures.includes(p)).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                onClick={addProcedure}
                disabled={!newProcedure || saving}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
              >
                {saving ? "Adding..." : "Add"}
              </button>
              <button
                onClick={() => {
                  setShowAddProcedure(false);
                  setNewProcedure("");
                }}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Profile Details Section */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Profile Details</h2>
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

        {editing ? (
          <div className="space-y-5">
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
              <button onClick={saveProfile} disabled={saving || !form.ageRange}
                className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium">
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Age Range</p>
                <p className="font-medium">{profile?.ageRange || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Activity Level</p>
                <p className="font-medium">{profile?.activityLevel?.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) || "Not set"}</p>
              </div>
            </div>
            {profile?.recoveryGoals?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Recovery Goals</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.recoveryGoals.map((g: string) => (
                    <span key={g} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{g}</span>
                  ))}
                </div>
              </div>
            )}
            {profile?.complicatingFactors?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Complicating Factors</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.complicatingFactors.map((f: string) => (
                    <span key={f} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}
            {profile?.lifestyleContext?.length > 0 && (
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

      {/* Recovery Timeline - shows for active procedure */}
      {activeProcedure && (
        <section className="mb-8">
          <RecoveryTimeline procedureType={activeProcedure} />
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
