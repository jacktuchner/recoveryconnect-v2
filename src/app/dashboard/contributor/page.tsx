"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PROCEDURE_TYPES, AGE_RANGES, ACTIVITY_LEVELS, RECOVERY_GOALS,
  TIME_SINCE_SURGERY, MIN_CALL_RATE, MAX_CALL_RATE, COMPLICATING_FACTORS,
} from "@/lib/constants";
import RecordingForm from "@/components/RecordingForm";
import ContributorGuidelines from "@/components/ContributorGuidelines";
import StripeConnectSetup from "@/components/StripeConnectSetup";
import AvailabilityManager from "@/components/AvailabilityManager";
import VideoCall from "@/components/VideoCall";
import SeriesForm from "@/components/SeriesForm";
import Link from "next/link";

interface ProcedureProfile {
  procedureDetails?: string;
  timeSinceSurgery?: string;
  recoveryGoals?: string[];
  complicatingFactors?: string[];
}

export default function ContributorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [showRecordingForm, setShowRecordingForm] = useState(false);
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [editingSeries, setEditingSeries] = useState<any>(null);
  const [deletingSeries, setDeletingSeries] = useState<string | null>(null);
  const [editingRecording, setEditingRecording] = useState<any>(null);
  const [deletingRecording, setDeletingRecording] = useState<string | null>(null);
  const [savingRecording, setSavingRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upgradingRole, setUpgradingRole] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  // State for adding new procedures
  const [showAddProcedure, setShowAddProcedure] = useState(false);
  const [newProcedure, setNewProcedure] = useState("");

  // State for editing individual procedures
  const [editingProcedure, setEditingProcedure] = useState<string | null>(null);
  const [procForm, setProcForm] = useState<ProcedureProfile>({
    procedureDetails: "",
    timeSinceSurgery: "",
    recoveryGoals: [],
    complicatingFactors: [],
  });

  // Shared profile fields (apply to all procedures)
  const [editingShared, setEditingShared] = useState(false);
  const [sharedForm, setSharedForm] = useState({
    ageRange: "",
    activityLevel: "RECREATIONAL",
    hourlyRate: 50,
    isAvailableForCalls: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    showRealName: true,
    displayName: "",
  });
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);

  // Bio and intro video state
  const [bio, setBio] = useState("");
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null);
  const [introVideoDuration, setIntroVideoDuration] = useState<number | null>(null);
  const [savingBio, setSavingBio] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);
  const [uploadingIntroVideo, setUploadingIntroVideo] = useState(false);
  const [introVideoError, setIntroVideoError] = useState<string | null>(null);


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
          } else {
            // New contributor - show add procedure flow
            setShowAddProcedure(true);
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

  // Get procedures list from profile
  const procedures = profile?.procedureTypes?.length > 0
    ? profile.procedureTypes
    : (profile?.procedureType ? [profile.procedureType] : []);

  // Get procedure profiles from profile
  const procedureProfiles: Record<string, ProcedureProfile> = profile?.procedureProfiles || {};

  // Helper to get procedure-specific data
  function getProcedureData(proc: string): ProcedureProfile {
    return procedureProfiles[proc] || {
      procedureDetails: proc === profile?.procedureType ? profile?.procedureDetails : "",
      timeSinceSurgery: proc === profile?.procedureType ? profile?.timeSinceSurgery : "",
      recoveryGoals: proc === profile?.procedureType ? profile?.recoveryGoals : [],
      complicatingFactors: proc === profile?.procedureType ? profile?.complicatingFactors : [],
    };
  }

  function startEditingProcedure(proc: string) {
    const data = getProcedureData(proc);
    setProcForm({
      procedureDetails: data.procedureDetails || "",
      timeSinceSurgery: data.timeSinceSurgery || "",
      recoveryGoals: data.recoveryGoals || [],
      complicatingFactors: data.complicatingFactors || [],
    });
    setEditingProcedure(proc);
  }

  async function saveProcedureData(proc: string) {
    setSaving(true);
    try {
      const updatedProfiles = {
        ...procedureProfiles,
        [proc]: procForm,
      };

      const res = await fetch("/api/profile", {
        method: profile ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sharedForm,
          procedureTypes: procedures,
          procedureProfiles: updatedProfiles,
          // Also update legacy fields if this is the primary procedure
          ...(proc === profile?.procedureType && {
            procedureDetails: procForm.procedureDetails,
            timeSinceSurgery: procForm.timeSinceSurgery,
            recoveryGoals: procForm.recoveryGoals,
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

  async function addProcedure() {
    if (!newProcedure || procedures.includes(newProcedure)) return;
    setSaving(true);
    try {
      const updatedProcedures = [...procedures, newProcedure];
      const updatedProfiles = {
        ...procedureProfiles,
        [newProcedure]: {
          procedureDetails: "",
          timeSinceSurgery: "",
          recoveryGoals: [],
          complicatingFactors: [],
        },
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
        setProfile(updated);
        setNewProcedure("");
        setShowAddProcedure(false);
        // Open edit for the new procedure
        startEditingProcedure(newProcedure);
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
        const updated = await res.json();
        setProfile(updated);
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

  function handleRecordingSuccess(recording: Record<string, unknown>) {
    setRecordings((prev) => [recording, ...prev]);
    setShowRecordingForm(false);
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

  async function saveBio() {
    setSavingBio(true);
    setBioSaved(false);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      if (res.ok) {
        setBioSaved(true);
        setTimeout(() => setBioSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBio(false);
    }
  }

  async function handleIntroVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["video/mp4", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      setIntroVideoError("Please upload an MP4 or WebM video file");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setIntroVideoError("Video must be under 50MB");
      return;
    }

    setUploadingIntroVideo(true);
    setIntroVideoError(null);

    try {
      // Get video duration
      const duration = await new Promise<number>((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          resolve(Math.round(video.duration));
        };
        video.src = URL.createObjectURL(file);
      });

      // Get presigned URL
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: `intro-video-${Date.now()}.${file.type.split("/")[1]}`,
          contentType: file.type,
        }),
      });

      if (!presignedRes.ok) {
        const err = await presignedRes.json();
        throw new Error(err.error || "Failed to get upload URL");
      }

      const { uploadUrl, fileUrl } = await presignedRes.json();

      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload video");
      }

      // Save to profile
      const profileRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sharedForm,
          procedureTypes: procedures,
          procedureProfiles: procedureProfiles,
          introVideoUrl: fileUrl,
          introVideoDuration: duration,
        }),
      });

      if (profileRes.ok) {
        const updated = await profileRes.json();
        setProfile(updated);
        setIntroVideoUrl(fileUrl);
        setIntroVideoDuration(duration);
      }
    } catch (err) {
      console.error("Error uploading intro video:", err);
      setIntroVideoError(err instanceof Error ? err.message : "Failed to upload video");
    } finally {
      setUploadingIntroVideo(false);
    }
  }

  async function removeIntroVideo() {
    if (!confirm("Remove your intro video?")) return;

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sharedForm,
          procedureTypes: procedures,
          procedureProfiles: procedureProfiles,
          introVideoUrl: null,
          introVideoDuration: null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setIntroVideoUrl(null);
        setIntroVideoDuration(null);
      }
    } catch (err) {
      console.error("Error removing intro video:", err);
    }
  }

  async function startEditingSeries(seriesId: string) {
    try {
      const res = await fetch(`/api/series/${seriesId}`);
      if (res.ok) {
        const seriesData = await res.json();
        setEditingSeries({
          id: seriesData.id,
          title: seriesData.title,
          description: seriesData.description || "",
          procedureType: seriesData.procedureType,
          discountPercent: seriesData.discountPercent,
          recordingIds: seriesData.recordings?.map((r: any) => r.id) || [],
          status: seriesData.status,
        });
        setShowSeriesForm(true);
      }
    } catch (err) {
      console.error("Error loading series for edit:", err);
    }
  }

  async function handleSeriesUpdate(updatedSeries: any) {
    // Refetch the series to get full data
    try {
      const res = await fetch(`/api/series/${updatedSeries.id}`);
      if (res.ok) {
        const fullSeries = await res.json();
        setSeries((prev) => prev.map((s) => (s.id === updatedSeries.id ? fullSeries : s)));
      }
    } catch (err) {
      // Fallback to using what we have
      setSeries((prev) => prev.map((s) => (s.id === updatedSeries.id ? updatedSeries : s)));
    }
    setEditingSeries(null);
    setShowSeriesForm(false);
  }

  async function deleteSeries(seriesId: string) {
    if (!confirm("Are you sure you want to delete this series? This cannot be undone.")) {
      return;
    }

    setDeletingSeries(seriesId);
    try {
      const res = await fetch(`/api/series/${seriesId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSeries((prev) => prev.filter((s) => s.id !== seriesId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete series");
      }
    } catch (err) {
      console.error("Error deleting series:", err);
      alert("Failed to delete series");
    } finally {
      setDeletingSeries(null);
    }
  }

  async function updateSeriesStatus(seriesId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/series/${seriesId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSeries((prev) =>
          prev.map((s) => (s.id === seriesId ? { ...s, status: newStatus } : s))
        );
      }
    } catch (err) {
      console.error("Error updating series status:", err);
    }
  }

  async function saveRecordingEdit() {
    if (!editingRecording) return;
    setSavingRecording(true);
    try {
      const res = await fetch(`/api/recordings/${editingRecording.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingRecording.title,
          description: editingRecording.description,
          price: editingRecording.price,
          category: editingRecording.category,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRecordings((prev) =>
          prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
        );
        setEditingRecording(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save recording");
      }
    } catch (err) {
      console.error("Error saving recording:", err);
      alert("Failed to save recording");
    } finally {
      setSavingRecording(false);
    }
  }

  async function deleteRecording(recordingId: string) {
    if (!confirm("Are you sure you want to delete this recording? This cannot be undone.")) {
      return;
    }

    setDeletingRecording(recordingId);
    try {
      const res = await fetch(`/api/recordings/${recordingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete recording");
      }
    } catch (err) {
      console.error("Error deleting recording:", err);
      alert("Failed to delete recording");
    } finally {
      setDeletingRecording(null);
    }
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

      {/* My Procedures Section */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">My Procedures</h2>
            <p className="text-sm text-gray-500 mt-1">
              Each procedure has its own recovery timeline and details
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
            const isEditing = editingProcedure === proc;

            return (
              <div
                key={proc}
                className="rounded-xl border-2 border-gray-200 bg-white transition-all"
              >
                {/* Procedure Header */}
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
                        {procData.timeSinceSurgery || "Time not set"}
                        {procData.recoveryGoals?.length ? ` • ${procData.recoveryGoals.length} goals` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <button
                        onClick={() => startEditingProcedure(proc)}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium px-2 py-1"
                      >
                        Edit
                      </button>
                    )}
                    {procedures.length > 1 && !isEditing && (
                      <button
                        onClick={() => removeProcedure(proc)}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time Since Surgery</label>
                        <select
                          value={procForm.timeSinceSurgery || ""}
                          onChange={(e) => setProcForm((f) => ({ ...f, timeSinceSurgery: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="">Select...</option>
                          {TIME_SINCE_SURGERY.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
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
            <h3 className="font-medium text-gray-900 mb-3">Add a Procedure</h3>
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
              {procedures.length > 0 && (
                <button
                  onClick={() => {
                    setShowAddProcedure(false);
                    setNewProcedure("");
                  }}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Prompt if no procedures */}
        {procedures.length === 0 && !showAddProcedure && (
          <p className="text-gray-500 text-center py-4">No procedures added yet. Add your first procedure to get started!</p>
        )}
      </section>

      {/* About You - Shared Profile Section */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">About You</h2>
            <p className="text-sm text-gray-500">These apply across all your procedures</p>
          </div>
          {!editingShared && profile && (
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Range *</label>
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

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={sharedForm.isAvailableForCalls}
                    onChange={(e) => setSharedForm((f) => ({ ...f, isAvailableForCalls: e.target.checked }))}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  Available for live calls
                </label>
              </div>
              {sharedForm.isAvailableForCalls && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate (${MIN_CALL_RATE}-${MAX_CALL_RATE})
                  </label>
                  <input
                    type="number"
                    min={MIN_CALL_RATE}
                    max={MAX_CALL_RATE}
                    value={sharedForm.hourlyRate}
                    onChange={(e) => setSharedForm((f) => ({ ...f, hourlyRate: parseInt(e.target.value) || 50 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
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
                    hourlyRate: profile?.hourlyRate || 50,
                    isAvailableForCalls: profile?.isAvailableForCalls || false,
                  });
                }}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : profile ? (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Age Range</p>
                <p className="font-medium">{profile.ageRange || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Activity Level</p>
                <p className="font-medium">
                  {profile.activityLevel?.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Calls</p>
                <p className="font-medium">
                  {profile.isAvailableForCalls ? `Available ($${profile.hourlyRate}/hr)` : "Not available"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Add a procedure first, then complete your profile.</p>
        )}
      </section>

      {/* Bio & Intro Video Section */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Your Bio & Intro Video</h2>
        <p className="text-sm text-gray-600 mb-6">
          Help patients get to know you before purchasing your content or booking a call.
        </p>

        <div className="space-y-6">
          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Share your recovery story, what motivates you to help others, and what patients can expect from your content..."
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">{bio.length}/500 characters</p>
              <div className="flex items-center gap-3">
                {bioSaved && (
                  <span className="text-sm text-green-600 font-medium">Saved!</span>
                )}
                <button
                  onClick={saveBio}
                  disabled={savingBio}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
                >
                  {savingBio ? "Saving..." : "Save Bio"}
                </button>
              </div>
            </div>
          </div>

          {/* Intro Video */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intro Video
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Record a short (1-3 minute) video introducing yourself. This appears at the top of your public profile.
            </p>

            {introVideoUrl ? (
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden bg-black">
                  <video
                    src={introVideoUrl}
                    controls
                    className="w-full max-h-64"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {introVideoDuration ? `${Math.floor(introVideoDuration / 60)}:${(introVideoDuration % 60).toString().padStart(2, "0")}` : "Video uploaded"}
                  </span>
                  <button
                    onClick={removeIntroVideo}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove Video
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 hover:bg-teal-50/50 transition-colors">
                    {uploadingIntroVideo ? (
                      <div className="py-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-600 border-t-transparent mb-2" />
                        <p className="text-sm text-gray-600">Uploading video...</p>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-600 mb-1">Click to upload an intro video</p>
                        <p className="text-xs text-gray-400">MP4 or WebM, max 50MB</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleIntroVideoUpload}
                    disabled={uploadingIntroVideo}
                    className="hidden"
                  />
                </label>
                {introVideoError && (
                  <p className="text-sm text-red-600 mt-2">{introVideoError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Privacy Settings */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Privacy Settings</h2>
        <p className="text-sm text-gray-600 mb-4">
          Control how your name appears on the platform. Your real name is always visible to admins for payment purposes.
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
                When enabled, your real name ({session?.user?.name}) will be visible to other users.
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
                placeholder="e.g., RecoveryMentor22"
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
            {recordings.map((rec: any) => {
              const isEditing = editingRecording?.id === rec.id;
              const isDeleting = deletingRecording === rec.id;

              if (isEditing) {
                return (
                  <div key={rec.id} className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={editingRecording.title}
                          onChange={(e) => setEditingRecording({ ...editingRecording, title: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={editingRecording.description || ""}
                          onChange={(e) => setEditingRecording({ ...editingRecording, description: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Price ($)</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            step={0.01}
                            value={editingRecording.price}
                            onChange={(e) => setEditingRecording({ ...editingRecording, price: parseFloat(e.target.value) || 9.99 })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                          <select
                            value={editingRecording.category}
                            onChange={(e) => setEditingRecording({ ...editingRecording, category: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="WEEKLY_TIMELINE">Timeline</option>
                            <option value="WISH_I_KNEW">Wish I Knew</option>
                            <option value="PRACTICAL_TIPS">Practical Tips</option>
                            <option value="MENTAL_HEALTH">Mental Health</option>
                            <option value="RETURN_TO_ACTIVITY">Return to Activity</option>
                            <option value="MISTAKES_AND_LESSONS">Mistakes & Lessons</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={saveRecordingEdit}
                          disabled={savingRecording}
                          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
                        >
                          {savingRecording ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingRecording(null)}
                          className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={rec.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{rec.title}</p>
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
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      rec.status === "PUBLISHED" ? "bg-green-100 text-green-700" :
                      rec.status === "PENDING_REVIEW" ? "bg-yellow-100 text-yellow-700" :
                      rec.status === "REJECTED" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>{rec.status.replace(/_/g, " ")}</span>
                    <button
                      onClick={() => setEditingRecording({ ...rec })}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteRecording(rec.id)}
                      disabled={isDeleting}
                      className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 disabled:opacity-50"
                    >
                      {isDeleting ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recording Series */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Your Series</h2>
            <p className="text-sm text-gray-500 mt-1">
              Bundle recordings together with a discount
            </p>
          </div>
          <button
            onClick={() => {
              setEditingSeries(null);
              setShowSeriesForm(!showSeriesForm);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            + New Series
          </button>
        </div>

        {showSeriesForm && (
          <div className="mb-6">
            <SeriesForm
              initialData={editingSeries}
              onSuccess={(updatedSeries) => {
                if (editingSeries) {
                  handleSeriesUpdate(updatedSeries);
                } else {
                  setSeries((prev) => [updatedSeries, ...prev]);
                  setShowSeriesForm(false);
                }
              }}
              onCancel={() => {
                setEditingSeries(null);
                setShowSeriesForm(false);
              }}
            />
          </div>
        )}

        {series.length === 0 && !showSeriesForm ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">No series yet</p>
            <p className="text-sm text-gray-400">
              Create a series to bundle related recordings and offer a discount
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {series.map((s: any) => {
              const recordingCount = s.recordings?.length || s.recordingCount || 0;
              const isDeleting = deletingSeries === s.id;
              return (
                <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-700">{recordingCount}</span>
                    </div>
                    <div>
                      <Link href={`/series/${s.id}`} className="font-medium hover:text-purple-700">
                        {s.title}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {s.procedureType} &middot; {s.discountPercent}% discount
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      s.status === "PUBLISHED" ? "bg-green-100 text-green-700" :
                      s.status === "ARCHIVED" ? "bg-gray-100 text-gray-600" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{s.status}</span>

                    {/* Publish/Unpublish button */}
                    {s.status === "DRAFT" && recordingCount >= 2 && (
                      <button
                        onClick={() => updateSeriesStatus(s.id, "PUBLISHED")}
                        className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-200 font-medium"
                      >
                        Publish
                      </button>
                    )}
                    {s.status === "PUBLISHED" && (
                      <button
                        onClick={() => updateSeriesStatus(s.id, "DRAFT")}
                        className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg hover:bg-gray-200 font-medium"
                      >
                        Unpublish
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => startEditingSeries(s.id)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium px-2 py-1"
                    >
                      Edit
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteSeries(s.id)}
                      disabled={isDeleting}
                      className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 disabled:opacity-50"
                    >
                      {isDeleting ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Availability Schedule */}
      {(profile?.isAvailableForCalls || sharedForm.isAvailableForCalls) && (
        <section className="mb-8">
          <AvailabilityManager />
        </section>
      )}

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
          <div className="space-y-4">
            {calls.map((call: any) => {
              const isUpcoming = call.status === "CONFIRMED" && new Date(call.scheduledAt) > new Date(Date.now() - call.durationMinutes * 60 * 1000);
              const canJoinCall = isUpcoming && call.videoRoomUrl;

              return (
                <div key={call.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-gray-50">
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
