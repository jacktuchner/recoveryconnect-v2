"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PROCEDURE_TYPES, AGE_RANGES, ACTIVITY_LEVELS, RECOVERY_GOALS, COMPLICATING_FACTORS, LIFESTYLE_CONTEXTS } from "@/lib/constants";
import { getTimeSinceSurgery, getTimeSinceSurgeryLabel, getCurrentRecoveryWeek } from "@/lib/surgeryDate";
import RecoveryTimeline from "@/components/RecoveryTimeline";
import ProfileWizard from "@/components/ProfileWizard";
import VideoCall from "@/components/VideoCall";

interface ProcedureProfile {
  procedureDetails?: string;
  surgeryDate?: string;
  timeSinceSurgery?: string;
  recoveryGoals?: string[];
  complicatingFactors?: string[];
}

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [showAddProcedure, setShowAddProcedure] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<string | null>(null);
  const [editingShared, setEditingShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [switchingProcedure, setSwitchingProcedure] = useState(false);

  // Shared profile fields
  const [sharedForm, setSharedForm] = useState({
    ageRange: "",
    activityLevel: "RECREATIONAL",
    lifestyleContext: [] as string[],
  });

  // Per-procedure form
  const [procForm, setProcForm] = useState<ProcedureProfile>({
    procedureDetails: "",
    surgeryDate: "",
    timeSinceSurgery: "",
    recoveryGoals: [],
    complicatingFactors: [],
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
            setSharedForm({
              ageRange: p.ageRange || "",
              activityLevel: p.activityLevel || "RECREATIONAL",
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

  // Get procedure profiles
  const procedureProfiles: Record<string, ProcedureProfile> = profile?.procedureProfiles || {};

  // Helper to get procedure-specific data
  function getProcedureData(proc: string): ProcedureProfile {
    const procProfile = procedureProfiles[proc];
    if (procProfile) {
      return {
        ...procProfile,
        // Compute timeSinceSurgery from surgeryDate if available
        timeSinceSurgery: procProfile.surgeryDate
          ? getTimeSinceSurgery(procProfile.surgeryDate) || procProfile.timeSinceSurgery
          : procProfile.timeSinceSurgery,
      };
    }
    return {
      procedureDetails: proc === profile?.procedureType ? profile?.procedureDetails : "",
      surgeryDate: proc === profile?.procedureType ? profile?.surgeryDate : "",
      timeSinceSurgery: proc === profile?.procedureType ? profile?.timeSinceSurgery : "",
      recoveryGoals: proc === profile?.procedureType ? profile?.recoveryGoals : [],
      complicatingFactors: proc === profile?.procedureType ? profile?.complicatingFactors : [],
    };
  }

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
      const updatedProfiles = {
        ...procedureProfiles,
        [newProcedure]: {
          procedureDetails: "",
          surgeryDate: "",
          timeSinceSurgery: "",
          recoveryGoals: [],
          complicatingFactors: [],
        },
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sharedForm,
          procedureTypes: updatedProcedures,
          procedureProfiles: updatedProfiles,
          activeProcedureType: newProcedure,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setNewProcedure("");
        setShowAddProcedure(false);
        // Open edit for the new procedure
        setEditingProcedure(newProcedure);
        setProcForm({
          procedureDetails: "",
          surgeryDate: "",
          timeSinceSurgery: "",
          recoveryGoals: [],
          complicatingFactors: [],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function removeProcedure(procedureType: string) {
    if (procedures.length <= 1) return;
    if (!confirm(`Remove ${procedureType} from your profile?`)) return;

    setSaving(true);
    try {
      const updatedProcedures = procedures.filter((p: string) => p !== procedureType);
      const updatedProfiles = { ...procedureProfiles };
      delete updatedProfiles[procedureType];
      const newActive = procedureType === activeProcedure ? updatedProcedures[0] : activeProcedure;

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sharedForm,
          procedureTypes: updatedProcedures,
          procedureType: updatedProcedures[0],
          procedureProfiles: updatedProfiles,
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

  function startEditingProcedure(proc: string) {
    const data = getProcedureData(proc);
    setProcForm({
      procedureDetails: data.procedureDetails || "",
      surgeryDate: data.surgeryDate || "",
      timeSinceSurgery: data.timeSinceSurgery || "",
      recoveryGoals: data.recoveryGoals || [],
      complicatingFactors: data.complicatingFactors || [],
    });
    setEditingProcedure(proc);
  }

  async function saveProcedureData(proc: string) {
    setSaving(true);
    try {
      // Compute timeSinceSurgery from surgeryDate
      const computedTimeSince = procForm.surgeryDate
        ? getTimeSinceSurgery(procForm.surgeryDate)
        : procForm.timeSinceSurgery;

      const procData = {
        ...procForm,
        timeSinceSurgery: computedTimeSince,
      };

      const updatedProfiles = {
        ...procedureProfiles,
        [proc]: procData,
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sharedForm,
          procedureTypes: procedures,
          procedureProfiles: updatedProfiles,
          // Also update legacy fields if this is the primary procedure
          ...(proc === profile?.procedureType && {
            procedureDetails: procData.procedureDetails,
            surgeryDate: procData.surgeryDate,
            timeSinceSurgery: computedTimeSince,
            recoveryGoals: procData.recoveryGoals,
            complicatingFactors: procForm.complicatingFactors,
          }),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setEditingProcedure(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function saveSharedProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sharedForm,
          procedureTypes: procedures,
          procedureProfiles: procedureProfiles,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setEditingShared(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleWizardComplete(data: any) {
    setWizardError(null);
    try {
      const initialProfiles = {
        [data.procedureType]: {
          procedureDetails: data.procedureDetails || "",
          timeSinceSurgery: data.timeSinceSurgery || "",
          recoveryGoals: data.recoveryGoals || [],
          complicatingFactors: data.complicatingFactors || [],
        },
      };

      const res = await fetch("/api/profile", {
        method: profile ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          procedureTypes: [data.procedureType],
          activeProcedureType: data.procedureType,
          procedureProfiles: initialProfiles,
        }),
      });
      if (res.ok) {
        const savedProfile = await res.json();
        setProfile(savedProfile);
        setSharedForm({
          ageRange: data.ageRange,
          activityLevel: data.activityLevel,
          lifestyleContext: data.lifestyleContext || [],
        });
        setShowWizard(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setWizardError(errorData.error || "Failed to save profile. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setWizardError("Network error. Please check your connection and try again.");
    }
  }

  function toggleProcFormGoal(value: string) {
    setProcForm((prev) => ({
      ...prev,
      recoveryGoals: prev.recoveryGoals?.includes(value)
        ? prev.recoveryGoals.filter((v) => v !== value)
        : [...(prev.recoveryGoals || []), value],
    }));
  }

  function toggleProcFormFactor(value: string) {
    setProcForm((prev) => ({
      ...prev,
      complicatingFactors: prev.complicatingFactors?.includes(value)
        ? prev.complicatingFactors.filter((v) => v !== value)
        : [...(prev.complicatingFactors || []), value],
    }));
  }

  function toggleSharedLifestyle(value: string) {
    setSharedForm((prev) => ({
      ...prev,
      lifestyleContext: prev.lifestyleContext.includes(value)
        ? prev.lifestyleContext.filter((v) => v !== value)
        : [...prev.lifestyleContext, value],
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
          error={wizardError}
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
              Each procedure has its own recovery goals and details
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
        <div className="space-y-4">
          {procedures.map((proc: string) => {
            const procData = getProcedureData(proc);
            const isActive = proc === activeProcedure;
            const isEditing = editingProcedure === proc;

            return (
              <div
                key={proc}
                className={`rounded-xl border-2 transition-all ${
                  isActive ? "border-teal-500 bg-teal-50/50" : "border-gray-200 bg-white"
                }`}
              >
                {/* Procedure Header */}
                <div
                  onClick={() => !isEditing && switchActiveProcedure(proc)}
                  className={`p-4 flex items-center justify-between ${!isEditing ? "cursor-pointer" : ""} ${switchingProcedure ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isActive ? "bg-teal-600" : "bg-gray-100"
                    }`}>
                      <svg className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${isActive ? "text-teal-900" : "text-gray-900"}`}>
                          {proc}
                        </h3>
                        {isActive && (
                          <span className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {procData.surgeryDate
                          ? getTimeSinceSurgeryLabel(procData.surgeryDate)
                          : (procData.timeSinceSurgery || "Surgery date not set")}
                        {procData.recoveryGoals?.length ? ` • ${procData.recoveryGoals.length} goals` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingProcedure(proc);
                        }}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium px-2 py-1"
                      >
                        Edit
                      </button>
                    )}
                    {procedures.length > 1 && !isEditing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeProcedure(proc);
                        }}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Remove procedure"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Procedure Edit Form */}
                {isEditing && (
                  <div className="border-t border-gray-200 p-4 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Details</label>
                        <input
                          type="text"
                          value={procForm.procedureDetails || ""}
                          onChange={(e) => setProcForm((f) => ({ ...f, procedureDetails: e.target.value }))}
                          placeholder="e.g., Patellar tendon graft"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Surgery Date</label>
                        <input
                          type="date"
                          value={procForm.surgeryDate || ""}
                          onChange={(e) => setProcForm((f) => ({ ...f, surgeryDate: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                        {procForm.surgeryDate && (
                          <p className="mt-1 text-sm text-teal-600 font-medium">
                            {getTimeSinceSurgeryLabel(procForm.surgeryDate)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recovery Goals for {proc}</label>
                      <div className="flex flex-wrap gap-2">
                        {RECOVERY_GOALS.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => toggleProcFormGoal(g)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                              procForm.recoveryGoals?.includes(g)
                                ? "bg-teal-50 border-teal-300 text-teal-700"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Complicating Factors for {proc}</label>
                      <div className="flex flex-wrap gap-2">
                        {COMPLICATING_FACTORS.map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => toggleProcFormFactor(f)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                              procForm.complicatingFactors?.includes(f)
                                ? "bg-orange-50 border-orange-300 text-orange-700"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => saveProcedureData(proc)}
                        disabled={saving}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingProcedure(null)}
                        className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Procedure Summary (when not editing) */}
                {!isEditing && ((procData.recoveryGoals?.length ?? 0) > 0 || (procData.complicatingFactors?.length ?? 0) > 0) && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                    {(procData.recoveryGoals?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {procData.recoveryGoals?.map((g: string) => (
                          <span key={g} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{g}</span>
                        ))}
                      </div>
                    )}
                    {(procData.complicatingFactors?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {procData.complicatingFactors?.map((f: string) => (
                          <span key={f} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Procedure */}
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
                {PROCEDURE_TYPES.filter((p) => !procedures.includes(p)).map((p) => (
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

      {/* Shared Profile Section */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">About You</h2>
            <p className="text-sm text-gray-500">These apply across all your procedures</p>
          </div>
          {!editingShared && (
            <button
              onClick={() => setEditingShared(true)}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Edit
            </button>
          )}
        </div>

        {editingShared ? (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                <select
                  value={sharedForm.ageRange}
                  onChange={(e) => setSharedForm((f) => ({ ...f, ageRange: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select...</option>
                  {AGE_RANGES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                <select
                  value={sharedForm.activityLevel}
                  onChange={(e) => setSharedForm((f) => ({ ...f, activityLevel: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {ACTIVITY_LEVELS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lifestyle Context</label>
              <div className="flex flex-wrap gap-2">
                {LIFESTYLE_CONTEXTS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleSharedLifestyle(l)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      sharedForm.lifestyleContext.includes(l)
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveSharedProfile}
                disabled={saving || !sharedForm.ageRange}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditingShared(false);
                  setSharedForm({
                    ageRange: profile?.ageRange || "",
                    activityLevel: profile?.activityLevel || "RECREATIONAL",
                    lifestyleContext: profile?.lifestyleContext || [],
                  });
                }}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm"
              >
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
                <p className="font-medium">
                  {profile?.activityLevel?.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) || "Not set"}
                </p>
              </div>
            </div>
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
          Control how your name appears when you leave reviews.
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
                When enabled, your real name ({session?.user?.name}) will be visible.
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
      {activeProcedure && (
        <section className="mb-8">
          <RecoveryTimeline
            procedureType={activeProcedure}
            currentWeek={getCurrentRecoveryWeek(getProcedureData(activeProcedure).surgeryDate || null) ?? undefined}
          />
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
          <div className="space-y-4">
            {calls.map((call: any) => {
              const isUpcoming = call.status === "CONFIRMED" && new Date(call.scheduledAt) > new Date(Date.now() - call.durationMinutes * 60 * 1000);
              const canJoinCall = isUpcoming && call.videoRoomUrl;

              return (
                <div key={call.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-gray-50">
                    <div>
                      <p className="font-medium">{call.contributor?.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(call.scheduledAt).toLocaleDateString()} at{" "}
                        {new Date(call.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" "}• {call.durationMinutes} min
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

                  {/* Video Call Section for confirmed calls */}
                  {canJoinCall && (
                    <div className="p-4 border-t border-gray-200">
                      <VideoCall
                        roomUrl={call.videoRoomUrl}
                        callId={call.id}
                        scheduledAt={new Date(call.scheduledAt)}
                        durationMinutes={call.durationMinutes}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
