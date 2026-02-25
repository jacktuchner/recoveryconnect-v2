"use client";

import { useState } from "react";

interface BioIntroVideoSectionProps {
  profile: any;
  sharedForm: {
    ageRange: string;
    activityLevel: string;
    hourlyRate: number;
    isAvailableForCalls: boolean;
  };
  initialBio: string;
  initialIntroVideoUrl: string | null;
  initialIntroVideoDuration: number | null;
  onProfileUpdate: (updated: any) => void;
}

export default function BioIntroVideoSection({
  profile, sharedForm, initialBio, initialIntroVideoUrl, initialIntroVideoDuration, onProfileUpdate,
}: BioIntroVideoSectionProps) {
  const [bio, setBio] = useState(initialBio);
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(initialIntroVideoUrl);
  const [introVideoDuration, setIntroVideoDuration] = useState<number | null>(initialIntroVideoDuration);
  const [savingBio, setSavingBio] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);
  const [uploadingIntroVideo, setUploadingIntroVideo] = useState(false);
  const [introVideoError, setIntroVideoError] = useState<string | null>(null);

  const procedures = profile?.procedureTypes?.length > 0
    ? profile.procedureTypes
    : (profile?.procedureType ? [profile.procedureType] : []);
  const procedureProfiles = profile?.procedureProfiles || {};

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

    const allowedTypes = ["video/mp4", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      setIntroVideoError("Please upload an MP4 or WebM video file");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setIntroVideoError("Video must be under 50MB");
      return;
    }

    setUploadingIntroVideo(true);
    setIntroVideoError(null);

    try {
      const duration = await new Promise<number>((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => resolve(Math.round(video.duration));
        video.src = URL.createObjectURL(file);
      });

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

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) throw new Error("Failed to upload video");

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
        onProfileUpdate(updated);
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
        onProfileUpdate(updated);
        setIntroVideoUrl(null);
        setIntroVideoDuration(null);
      }
    } catch (err) {
      console.error("Error removing intro video:", err);
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Your Bio & Intro Video</h2>
      <p className="text-sm text-gray-600 mb-6">Help seekers get to know you before purchasing your content or booking a call.</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Share your recovery story, what motivates you to help others, and what seekers can expect from your content..." />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">{bio.length}/500 characters</p>
            <div className="flex items-center gap-3">
              {bioSaved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
              <button onClick={saveBio} disabled={savingBio} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium">{savingBio ? "Saving..." : "Save Bio"}</button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Intro Video</label>
          <p className="text-xs text-gray-500 mb-3">Record a short (1-3 minute) video introducing yourself. This appears at the top of your public profile.</p>

          {introVideoUrl ? (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden bg-black">
                <video src={introVideoUrl} controls className="w-full max-h-64" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {introVideoDuration ? `${Math.floor(introVideoDuration / 60)}:${(introVideoDuration % 60).toString().padStart(2, "0")}` : "Video uploaded"}
                </span>
                <button onClick={removeIntroVideo} className="text-sm text-red-600 hover:text-red-700 font-medium">Remove Video</button>
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
                <input type="file" accept="video/mp4,video/webm" onChange={handleIntroVideoUpload} disabled={uploadingIntroVideo} className="hidden" />
              </label>
              {introVideoError && <p className="text-sm text-red-600 mt-2">{introVideoError}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
