"use client";

import { useState } from "react";
import {
  PROCEDURE_TYPES, RECOVERY_GOALS, COMPLICATING_FACTORS,
  CHRONIC_PAIN_CONDITIONS, CHRONIC_PAIN_GOALS, CHRONIC_PAIN_COMPLICATING_FACTORS,
  isChronicPainCondition, getAllConditions,
} from "@/lib/constants";
import { getTimeSinceSurgery, getTimeSinceSurgeryLabel, getTimeSinceDiagnosisLabel } from "@/lib/surgeryDate";

interface ProcedureProfile {
  procedureDetails?: string;
  surgeryDate?: string;
  timeSinceSurgery?: string;
  recoveryGoals?: string[];
  complicatingFactors?: string[];
}

interface ProceduresSectionProps {
  profile: any;
  sharedForm: {
    ageRange: string;
    activityLevel: string;
    hourlyRate: number;
    isAvailableForCalls: boolean;
  };
  onProfileUpdate: (updated: any) => void;
}

// Normalize procedureProfiles value: legacy object → array
function getInstances(procedureProfiles: Record<string, any>, proc: string, legacyProfile?: any): ProcedureProfile[] {
  const val = procedureProfiles[proc];
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object" && Object.keys(val).length > 0) return [val];
  // Fallback to legacy top-level fields for the primary procedure
  if (legacyProfile && proc === legacyProfile.procedureType) {
    return [{
      procedureDetails: legacyProfile.procedureDetails || "",
      surgeryDate: legacyProfile.surgeryDate || "",
      timeSinceSurgery: legacyProfile.timeSinceSurgery || "",
      recoveryGoals: legacyProfile.recoveryGoals || [],
      complicatingFactors: legacyProfile.complicatingFactors || [],
    }];
  }
  return [{ procedureDetails: "", surgeryDate: "", timeSinceSurgery: "", recoveryGoals: [], complicatingFactors: [] }];
}

function enrichInstance(inst: ProcedureProfile): ProcedureProfile {
  return {
    ...inst,
    timeSinceSurgery: inst.surgeryDate
      ? getTimeSinceSurgery(inst.surgeryDate) || inst.timeSinceSurgery
      : inst.timeSinceSurgery,
  };
}

export default function ProceduresSection({ profile, sharedForm, onProfileUpdate }: ProceduresSectionProps) {
  const [editing, setEditing] = useState<{ proc: string; idx: number } | null>(null);
  const [procForm, setProcForm] = useState<ProcedureProfile>({
    procedureDetails: "",
    surgeryDate: "",
    timeSinceSurgery: "",
    recoveryGoals: [],
    complicatingFactors: [],
  });
  const [showAddProcedure, setShowAddProcedure] = useState(false);
  const [newProcedure, setNewProcedure] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const procedures: string[] = profile?.procedureTypes?.length > 0
    ? profile.procedureTypes
    : (profile?.procedureType ? [profile.procedureType] : []);

  const procedureProfiles: Record<string, any> = profile?.procedureProfiles || {};

  function startEditing(proc: string, idx: number) {
    const instances = getInstances(procedureProfiles, proc, profile);
    const data = enrichInstance(instances[idx] || {});
    setProcForm({
      procedureDetails: data.procedureDetails || "",
      surgeryDate: data.surgeryDate || "",
      timeSinceSurgery: data.timeSinceSurgery || "",
      recoveryGoals: data.recoveryGoals || [],
      complicatingFactors: data.complicatingFactors || [],
    });
    setEditing({ proc, idx });
  }

  async function saveInstance(proc: string, idx: number) {
    setSaving(true);
    try {
      const computedTimeSince = procForm.surgeryDate
        ? getTimeSinceSurgery(procForm.surgeryDate)
        : procForm.timeSinceSurgery;

      const instanceData = { ...procForm, timeSinceSurgery: computedTimeSince || undefined };
      const instances = [...getInstances(procedureProfiles, proc, profile)];
      instances[idx] = instanceData;

      const updatedProfiles = { ...procedureProfiles, [proc]: instances };

      const res = await fetch("/api/profile", {
        method: profile ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sharedForm,
          procedureTypes: procedures,
          procedureProfiles: updatedProfiles,
          ...(proc === profile?.procedureType && idx === 0 && {
            procedureDetails: instanceData.procedureDetails,
            surgeryDate: instanceData.surgeryDate,
            timeSinceSurgery: computedTimeSince,
            recoveryGoals: instanceData.recoveryGoals,
            complicatingFactors: instanceData.complicatingFactors,
          }),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onProfileUpdate(updated);
        setEditing(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function addProcedure() {
    if (!newProcedure || procedures.includes(newProcedure)) return;
    setSaving(true);
    try {
      const updatedProcedures = [...procedures, newProcedure];
      const updatedProfiles = {
        ...procedureProfiles,
        [newProcedure]: [{ procedureDetails: "", surgeryDate: "", timeSinceSurgery: "", recoveryGoals: [], complicatingFactors: [] }],
      };

      const res = await fetch("/api/profile", {
        method: profile ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sharedForm,
          procedureType: profile?.procedureType || newProcedure,
          procedureTypes: updatedProcedures,
          procedureProfiles: updatedProfiles,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onProfileUpdate(updated);
        setNewProcedure("");
        setShowAddProcedure(false);
        startEditing(newProcedure, 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function addInstance(proc: string) {
    setSaving(true);
    try {
      const instances = [...getInstances(procedureProfiles, proc, profile)];
      instances.push({ procedureDetails: "", surgeryDate: "", timeSinceSurgery: "", recoveryGoals: [], complicatingFactors: [] });
      const updatedProfiles = { ...procedureProfiles, [proc]: instances };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sharedForm,
          procedureTypes: procedures,
          procedureProfiles: updatedProfiles,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onProfileUpdate(updated);
        startEditing(proc, instances.length - 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function removeInstance(proc: string, idx: number) {
    const instances = getInstances(procedureProfiles, proc, profile);
    if (instances.length <= 1) {
      // Last instance — remove the whole procedure type
      return removeProcedure(proc);
    }
    const label = instances[idx].procedureDetails || (isChronicPainCondition(proc) ? `entry #${idx + 1}` : `surgery #${idx + 1}`);
    if (!confirm(`Remove "${label}" from ${proc}?`)) return;

    setSaving(true);
    try {
      const updated = instances.filter((_, i) => i !== idx);
      const updatedProfiles = { ...procedureProfiles, [proc]: updated };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sharedForm,
          procedureTypes: procedures,
          procedureProfiles: updatedProfiles,
        }),
      });
      if (res.ok) {
        onProfileUpdate(await res.json());
        if (editing?.proc === proc && editing.idx === idx) setEditing(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function removeProcedure(proc: string) {
    if (procedures.length <= 1) return;
    if (!confirm(`Remove ${proc} and all its entries from your profile?`)) return;

    setSaving(true);
    try {
      const updatedProcedures = procedures.filter((p: string) => p !== proc);
      const updatedProfiles = { ...procedureProfiles };
      delete updatedProfiles[proc];

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sharedForm,
          procedureType: updatedProcedures[0],
          procedureTypes: updatedProcedures,
          procedureProfiles: updatedProfiles,
        }),
      });
      if (res.ok) {
        onProfileUpdate(await res.json());
        if (editing?.proc === proc) setEditing(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
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

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">My Health Profile</h2>
          <p className="text-sm text-gray-500 mt-1">
            Your surgeries and conditions, each with their own timeline and details
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
          <button
            onClick={() => setShowAddProcedure(true)}
            className="text-sm bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-100 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {procedures.map((proc: string) => {
          const instances = getInstances(procedureProfiles, proc, profile);

          return (
            <div key={proc} className="rounded-xl border-2 border-gray-200 bg-white transition-all">
              {/* Procedure type header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-100">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{proc}</h3>
                    <p className="text-sm text-gray-500">
                      {isChronicPainCondition(proc) ? null : `${instances.length} ${instances.length === 1 ? "surgery" : "surgeries"}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {procedures.length > 1 && (
                    <button onClick={() => removeProcedure(proc)} className="text-gray-400 hover:text-red-500 p-1" title="Remove">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Instances */}
              <div className="border-t border-gray-100">
                {instances.map((inst, idx) => {
                  const data = enrichInstance(inst);
                  const isEditing = editing?.proc === proc && editing.idx === idx;

                  return (
                    <div key={idx} className={`${idx > 0 ? "border-t border-gray-100" : ""}`}>
                      {!isEditing && (
                        <div className="px-4 py-3 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">
                              {data.procedureDetails || <span className="text-gray-400 italic">No details yet</span>}
                            </p>
                            <p className="text-xs text-gray-500">
                              {data.surgeryDate
                                ? (isChronicPainCondition(proc) ? getTimeSinceDiagnosisLabel(data.surgeryDate) : getTimeSinceSurgeryLabel(data.surgeryDate))
                                : (data.timeSinceSurgery || (isChronicPainCondition(proc) ? "Diagnosis date not set" : "Surgery date not set"))}
                              {data.recoveryGoals?.length ? ` · ${data.recoveryGoals.length} goals` : ""}
                            </p>
                            {((data.recoveryGoals?.length ?? 0) > 0 || (data.complicatingFactors?.length ?? 0) > 0) && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {data.recoveryGoals?.map((g: string) => (
                                  <span key={g} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{g}</span>
                                ))}
                                {data.complicatingFactors?.map((f: string) => (
                                  <span key={f} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{f}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <button onClick={() => startEditing(proc, idx)} className="text-sm text-teal-600 hover:text-teal-700 font-medium px-2 py-1">Edit</button>
                            {instances.length > 1 && (
                              <button onClick={() => removeInstance(proc, idx)} className="text-gray-400 hover:text-red-500 p-1" title={isChronicPainCondition(proc) ? "Remove this entry" : "Remove this surgery"}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {isEditing && (
                        <div className="p-4 space-y-4 bg-gray-50/50">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{isChronicPainCondition(proc) ? "Condition Details" : "Procedure Details"}</label>
                              <input type="text" value={procForm.procedureDetails || ""} onChange={(e) => setProcForm((f) => ({ ...f, procedureDetails: e.target.value }))} placeholder={isChronicPainCondition(proc) ? "e.g., Widespread pain, primarily legs" : "e.g., Left shoulder, Right knee"} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{isChronicPainCondition(proc) ? "Diagnosis Date" : "Surgery Date"}</label>
                              <input type="date" value={procForm.surgeryDate || ""} onChange={(e) => setProcForm((f) => ({ ...f, surgeryDate: e.target.value }))} max={new Date().toISOString().split("T")[0]} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                              {procForm.surgeryDate && (
                                <p className="mt-1 text-sm text-teal-600 font-medium">{isChronicPainCondition(proc) ? getTimeSinceDiagnosisLabel(procForm.surgeryDate) : getTimeSinceSurgeryLabel(procForm.surgeryDate)}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{isChronicPainCondition(proc) ? "Management Goals" : "Recovery Goals"}</label>
                            <div className="flex flex-wrap gap-2">
                              {(isChronicPainCondition(proc) ? CHRONIC_PAIN_GOALS : RECOVERY_GOALS).map((g) => (
                                <button key={g} type="button" onClick={() => toggleProcFormGoal(g)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${procForm.recoveryGoals?.includes(g) ? "bg-teal-50 border-teal-300 text-teal-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>{g}</button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Complicating Factors</label>
                            <div className="flex flex-wrap gap-2">
                              {(isChronicPainCondition(proc) ? CHRONIC_PAIN_COMPLICATING_FACTORS : COMPLICATING_FACTORS).map((f) => (
                                <button key={f} type="button" onClick={() => toggleProcFormFactor(f)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${procForm.complicatingFactors?.includes(f) ? "bg-orange-50 border-orange-300 text-orange-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>{f}</button>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button onClick={() => saveInstance(proc, idx)} disabled={saving} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium">{saving ? "Saving..." : "Save"}</button>
                            <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add another instance (only for surgeries — chronic pain conditions can't be duplicated) */}
                {!isChronicPainCondition(proc) && (
                  <div className="px-4 py-2 border-t border-gray-100">
                    <button
                      onClick={() => addInstance(proc)}
                      disabled={saving}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add another {proc}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAddProcedure && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="font-medium text-gray-900 mb-3">Add to Your Health Profile</h3>
          <div className="flex gap-3">
            <select value={newProcedure} onChange={(e) => setNewProcedure(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Choose a surgery or condition...</option>
              <optgroup label="Surgeries">
                {getAllConditions().filter((c) => c.category === "SURGERY" && !procedures.includes(c.value)).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </optgroup>
              <optgroup label="Autoimmune">
                {getAllConditions().filter((c) => c.category === "CHRONIC_PAIN" && !procedures.includes(c.value)).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </optgroup>
            </select>
            <button onClick={addProcedure} disabled={!newProcedure || saving} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium">{saving ? "Adding..." : "Add"}</button>
            {procedures.length > 0 && (
              <button onClick={() => { setShowAddProcedure(false); setNewProcedure(""); }} className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm">Cancel</button>
            )}
          </div>
        </div>
      )}

      {procedures.length === 0 && !showAddProcedure && (
        <p className="text-gray-500 text-center py-4">Nothing added yet. Add your first surgery or condition to get started!</p>
      )}
    </section>
  );
}
