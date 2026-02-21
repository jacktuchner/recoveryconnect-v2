"use client";

import { useState } from "react";
import { AGE_RANGES, GENDERS, ACTIVITY_LEVELS, MIN_CALL_RATE, MAX_CALL_RATE } from "@/lib/constants";
import AvailabilityManager from "@/components/AvailabilityManager";

interface SharedProfileSectionProps {
  profile: any;
  sharedForm: {
    ageRange: string;
    gender: string;
    activityLevel: string;
    hourlyRate: number;
    isAvailableForCalls: boolean;
  };
  onSharedFormChange: (form: { ageRange: string; gender: string; activityLevel: string; hourlyRate: number; isAvailableForCalls: boolean }) => void;
  onProfileUpdate: (updated: any) => void;
}

export default function SharedProfileSection({ profile, sharedForm, onSharedFormChange, onProfileUpdate }: SharedProfileSectionProps) {
  const [editingShared, setEditingShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const procedures = profile?.procedureTypes?.length > 0
    ? profile.procedureTypes
    : (profile?.procedureType ? [profile.procedureType] : []);

  const procedureProfiles = profile?.procedureProfiles || {};

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
        onProfileUpdate(updated);
        setEditingShared(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">About You</h2>
          <p className="text-sm text-gray-500">These apply across all your procedures</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
          {!editingShared && profile && (
            <button onClick={() => setEditingShared(true)} className="text-sm text-teal-600 hover:text-teal-700 font-medium">Edit</button>
          )}
        </div>
      </div>

      {editingShared ? (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age Range *</label>
              <select value={sharedForm.ageRange} onChange={(e) => onSharedFormChange({ ...sharedForm, ageRange: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select...</option>
                {AGE_RANGES.map((a) => (<option key={a} value={a}>{a}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={sharedForm.gender} onChange={(e) => onSharedFormChange({ ...sharedForm, gender: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select...</option>
                {GENDERS.map((g) => (<option key={g.value} value={g.value}>{g.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
              <select value={sharedForm.activityLevel} onChange={(e) => onSharedFormChange({ ...sharedForm, activityLevel: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {ACTIVITY_LEVELS.map((a) => (<option key={a.value} value={a.value}>{a.label}</option>))}
              </select>
            </div>
          </div>

          <div className="border border-cyan-200 rounded-lg p-4 bg-cyan-50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={sharedForm.isAvailableForCalls} onChange={(e) => onSharedFormChange({ ...sharedForm, isAvailableForCalls: e.target.checked })} className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 w-5 h-5" />
                  <span className="font-semibold text-gray-900">Become a Guide</span>
                </label>
                <p className="text-sm text-gray-600 mt-1">Offer 1-on-1 video calls with seekers. You&apos;ll appear on the Guides page and can set your availability.</p>
                {sharedForm.isAvailableForCalls && (
                  <>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Hourly Rate</label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">$</span>
                        <input type="number" min={MIN_CALL_RATE} max={MAX_CALL_RATE} value={sharedForm.hourlyRate} onChange={(e) => onSharedFormChange({ ...sharedForm, hourlyRate: parseInt(e.target.value) || 50 })} className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        <span className="text-gray-500">/ hour</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Range: ${MIN_CALL_RATE} - ${MAX_CALL_RATE}</p>
                    </div>
                    <div className="mt-4">
                      <AvailabilityManager />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={saveSharedProfile} disabled={saving || !sharedForm.ageRange} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium">{saving ? "Saving..." : "Save"}</button>
            <button onClick={() => {
              setEditingShared(false);
              onSharedFormChange({
                ageRange: profile?.ageRange || "",
                gender: profile?.gender || "",
                activityLevel: profile?.activityLevel || "RECREATIONAL",
                hourlyRate: profile?.hourlyRate || 50,
                isAvailableForCalls: profile?.isAvailableForCalls || false,
              });
            }} className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm">Cancel</button>
          </div>
        </div>
      ) : profile ? (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Age Range</p>
              <p className="font-medium">{profile.ageRange || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Gender</p>
              <p className="font-medium">{GENDERS.find((g: any) => g.value === profile.gender)?.label || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Activity Level</p>
              <p className="font-medium">{profile.activityLevel?.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Guide Calls</p>
              {profile.isAvailableForCalls ? (
                <p className="font-medium text-cyan-700 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Active (${profile.hourlyRate}/hr)
                </p>
              ) : (
                <p className="font-medium text-gray-400">Not enabled</p>
              )}
            </div>
          </div>
          {profile.isAvailableForCalls && (
            <div className="mt-4">
              <AvailabilityManager />
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Add a procedure first, then complete your profile.</p>
      )}
    </section>
  );
}
