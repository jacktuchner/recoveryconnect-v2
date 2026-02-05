"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PROCEDURE_TYPES, AGE_RANGES, ACTIVITY_LEVELS, RECOVERY_GOALS,
  TIME_SINCE_SURGERY, MIN_CALL_RATE, MAX_CALL_RATE,
} from "@/lib/constants";
import RecordingForm from "@/components/RecordingForm";
import ContributorGuidelines from "@/components/ContributorGuidelines";
import StripeConnectSetup from "@/components/StripeConnectSetup";

export default function ContributorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showRecordingForm, setShowRecordingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upgradingRole, setUpgradingRole] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const [form, setForm] = useState({
    procedureType: "",
    procedureTypes: [] as string[],
    procedureDetails: "",
    ageRange: "",
    activityLevel: "RECREATIONAL",
    recoveryGoals: [] as string[],
    timeSinceSurgery: "",
    complicatingFactors: [] as string[],
    lifestyleContext: [] as string[],
    hourlyRate: 50,
    isAvailableForCalls: false,
  });


  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user) return;
    async function load() {
      try {
        const [profileRes, callsRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/calls"),
        ]);
        if (profileRes.ok) {
          const p = await profileRes.json();
          if (p) {
            setProfile(p);
            setForm({
              procedureType: p.procedureType || "",
              procedureTypes: p.procedureTypes || (p.procedureType ? [p.procedureType] : []),
              procedureDetails: p.procedureDetails || "",
              ageRange: p.ageRange || "",
              activityLevel: p.activityLevel || "RECREATIONAL",
              recoveryGoals: p.recoveryGoals || [],
              timeSinceSurgery: p.timeSinceSurgery || "",
              complicatingFactors: p.complicatingFactors || [],
              lifestyleContext: p.lifestyleContext || [],
              hourlyRate: p.hourlyRate || 50,
              isAvailableForCalls: p.isAvailableForCalls || false,
            });
            const recRes = await fetch("/api/recordings/mine");
            if (recRes.ok) setRecordings(await recRes.json());
          } else {
            setEditingProfile(true);
          }
        }
        if (callsRes.ok) setCalls(await callsRes.json());
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
        setProfile(await res.json());
        setEditingProfile(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleRecordingSuccess(recording: Record<string, unknown>) {
    setRecordings((prev) => [recording, ...prev]);
    setShowRecordingForm(false);
  }

  async function updateCallStatus(callId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/calls/${callId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCalls((prev) => prev.map((c) => (c.id === callId ? updated : c)));
      }
    } catch (err) {
      console.error(err);
    }
  }

  function toggleArrayItem(key: "recoveryGoals" | "complicatingFactors" | "lifestyleContext", value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }));
  }

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
          <p className="text-2xl font-bold text-teal-700">
            {recordings.reduce((a, r) => a + (r.viewCount || 0), 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Calls Completed</p>
          <p className="text-2xl font-bold text-teal-700">
            {calls.filter((c) => c.status === "COMPLETED").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending Calls</p>
          <p className="text-2xl font-bold text-yellow-600">
            {calls.filter((c) => c.status === "REQUESTED").length}
          </p>
        </div>
      </div>

      {/* Profile */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Your Contributor Profile</h2>
          {profile && !editingProfile && (
            <button onClick={() => setEditingProfile(true)} className="text-sm text-teal-600 hover:text-teal-700 font-medium">
              Edit
            </button>
          )}
        </div>

        {editingProfile ? (
          <div className="space-y-5">
            {/* Multiple Procedures */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Procedures/Surgeries *</label>
              <div className="space-y-2">
                {form.procedureTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.procedureTypes.map((proc) => (
                      <span key={proc} className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-sm">
                        {proc}
                        <button
                          type="button"
                          onClick={() => {
                            const newTypes = form.procedureTypes.filter(p => p !== proc);
                            setForm(f => ({
                              ...f,
                              procedureTypes: newTypes,
                              procedureType: newTypes[0] || ""
                            }));
                          }}
                          className="ml-1 text-teal-500 hover:text-teal-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <select
                    id="add-procedure"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      const proc = e.target.value;
                      if (proc && !form.procedureTypes.includes(proc)) {
                        setForm(f => ({
                          ...f,
                          procedureTypes: [...f.procedureTypes, proc],
                          procedureType: f.procedureType || proc
                        }));
                      }
                      e.target.value = "";
                    }}
                  >
                    <option value="">Add a procedure...</option>
                    {PROCEDURE_TYPES.filter(p => !form.procedureTypes.includes(p)).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                {form.procedureTypes.length === 0 && (
                  <p className="text-sm text-gray-500">Add at least one procedure you&apos;ve had.</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Since Surgery</label>
                <select value={form.timeSinceSurgery} onChange={(e) => setForm(f => ({...f, timeSinceSurgery: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select</option>
                  {TIME_SINCE_SURGERY.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Details</label>
                <input
                  type="text"
                  value={form.procedureDetails}
                  onChange={(e) => setForm(f => ({...f, procedureDetails: e.target.value}))}
                  placeholder="e.g., Patellar tendon graft"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
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
                      form.recoveryGoals.includes(g) ? "bg-teal-50 border-teal-300 text-teal-700" : "border-gray-200 text-gray-600"
                    }`}>{g}</button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={form.isAvailableForCalls}
                    onChange={(e) => setForm(f => ({...f, isAvailableForCalls: e.target.checked}))}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  Available for live calls
                </label>
              </div>
              {form.isAvailableForCalls && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate (${MIN_CALL_RATE}-${MAX_CALL_RATE})
                  </label>
                  <input type="number" min={MIN_CALL_RATE} max={MAX_CALL_RATE}
                    value={form.hourlyRate}
                    onChange={(e) => setForm(f => ({...f, hourlyRate: parseInt(e.target.value) || 50}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={saveProfile} disabled={saving || form.procedureTypes.length === 0 || !form.ageRange}
                className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium">
                {saving ? "Saving..." : "Save Profile"}
              </button>
              {profile && (
                <button onClick={() => setEditingProfile(false)} className="text-sm text-gray-500 px-4 py-2">Cancel</button>
              )}
            </div>
          </div>
        ) : profile ? (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Procedures</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(profile.procedureTypes?.length > 0 ? profile.procedureTypes : [profile.procedureType]).map((proc: string) => (
                    <span key={proc} className="text-sm bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{proc}</span>
                  ))}
                </div>
              </div>
              <div><p className="text-xs text-gray-500">Age Range</p><p className="font-medium">{profile.ageRange}</p></div>
              <div><p className="text-xs text-gray-500">Calls</p><p className="font-medium">{profile.isAvailableForCalls ? `Available ($${profile.hourlyRate}/hr)` : "Not available"}</p></div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Recordings */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Your Recordings</h2>
          <button onClick={() => setShowRecordingForm(!showRecordingForm)}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">
            + New Recording
          </button>
        </div>

        {showRecordingForm && (
          <ContributorGuidelines>
            <div className="mb-6">
              <RecordingForm
                onSuccess={handleRecordingSuccess}
                onCancel={() => setShowRecordingForm(false)}
              />
            </div>
          </ContributorGuidelines>
        )}

        {recordings.length === 0 && !showRecordingForm ? (
          <p className="text-gray-500 text-center py-8">No recordings yet. Create your first one!</p>
        ) : (
          <div className="space-y-3">
            {recordings.map((rec: any) => (
              <div key={rec.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{rec.title}</p>
                  <p className="text-sm text-gray-500">
                    {rec.category.replace(/_/g, " ")} &middot; ${rec.price} &middot; {rec.viewCount} views
                    {rec.transcriptionStatus && rec.transcriptionStatus !== "NONE" && (
                      <span className={`ml-2 ${
                        rec.transcriptionStatus === "COMPLETED" ? "text-green-600" :
                        rec.transcriptionStatus === "PENDING" ? "text-yellow-600" :
                        "text-red-600"
                      }`}>
                        &middot; Transcription: {rec.transcriptionStatus.toLowerCase()}
                      </span>
                    )}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  rec.status === "PUBLISHED" ? "bg-green-100 text-green-700" :
                  rec.status === "PENDING_REVIEW" ? "bg-yellow-100 text-yellow-700" :
                  rec.status === "REJECTED" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-600"
                }`}>{rec.status.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payout Settings */}
      <section className="mb-8">
        <StripeConnectSetup />
      </section>

      {/* Incoming Calls */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">Call Requests</h2>
        {calls.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No call requests yet.</p>
        ) : (
          <div className="space-y-3">
            {calls.map((call: any) => (
              <div key={call.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{call.patient?.name || "Patient"}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(call.scheduledAt).toLocaleDateString()} at{" "}
                    {new Date(call.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" "}&middot; {call.durationMinutes} min &middot; ${call.contributorPayout.toFixed(2)} payout
                  </p>
                  {call.questionsInAdvance && (
                    <p className="text-sm text-gray-400 mt-1">Questions: {call.questionsInAdvance}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {call.status === "REQUESTED" && (
                    <>
                      <button onClick={() => updateCallStatus(call.id, "CONFIRMED")}
                        className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 font-medium">
                        Confirm
                      </button>
                      <button onClick={() => updateCallStatus(call.id, "CANCELLED")}
                        className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 font-medium">
                        Decline
                      </button>
                    </>
                  )}
                  {call.status === "CONFIRMED" && (
                    <button onClick={() => updateCallStatus(call.id, "COMPLETED")}
                      className="text-xs bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-200 font-medium">
                      Mark Completed
                    </button>
                  )}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    call.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                    call.status === "REQUESTED" ? "bg-yellow-100 text-yellow-700" :
                    call.status === "COMPLETED" ? "bg-gray-100 text-gray-600" :
                    "bg-red-100 text-red-700"
                  }`}>{call.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upgrade to Patient Access - Only show for CONTRIBUTOR role */}
      {(session?.user as any)?.role === "CONTRIBUTOR" && (
        <section className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-teal-200 p-6 mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Need guidance for a new surgery?</h2>
              <p className="text-sm text-gray-600 mt-1">
                Get access to patient features like watching recovery stories and booking mentors.
              </p>
            </div>
            {upgradeSuccess ? (
              <div className="flex flex-col items-start sm:items-end gap-2">
                <span className="text-sm text-green-700 font-medium">Role upgraded successfully!</span>
                <button
                  onClick={() => signOut()}
                  className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium"
                >
                  Sign out to apply changes
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-start sm:items-end gap-2">
                {upgradeError && (
                  <span className="text-sm text-red-600">{upgradeError}</span>
                )}
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
