"use client";

import { useState, useCallback } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import VideoRecorder from "@/components/VideoRecorder";
import ThumbnailSelector from "@/components/ThumbnailSelector";

interface RecordingEditFormProps {
  recording: any;
  seriesInfo?: { seriesId: string; seriesTitle: string };
  onSave: (updated: any) => void;
  onCancel: () => void;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "Unknown";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    WEEKLY_TIMELINE: "Timeline",
    WISH_I_KNEW: "Wish I Knew",
    PRACTICAL_TIPS: "Practical Tips",
    MENTAL_HEALTH: "Mental Health",
    RETURN_TO_ACTIVITY: "Return to Activity",
    MISTAKES_AND_LESSONS: "Mistakes & Lessons",
  };
  return labels[category] || category?.replace(/_/g, " ") || "";
}

export default function RecordingEditForm({ recording, seriesInfo, onSave, onCancel }: RecordingEditFormProps) {
  const [form, setForm] = useState({
    title: recording.title || "",
    description: recording.description || "",
    category: recording.category || "WISH_I_KNEW",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Media replacement state
  const [showReplace, setShowReplace] = useState(false);
  const [newMediaBlob, setNewMediaBlob] = useState<Blob | null>(null);
  const [newDuration, setNewDuration] = useState<number | null>(null);
  const [newTranscript, setNewTranscript] = useState<string | null>(null);
  const [newThumbnailBlob, setNewThumbnailBlob] = useState<Blob | null>(null);
  const [showThumbnailSelector, setShowThumbnailSelector] = useState(false);

  // Thumbnail upload state
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [newThumbnailUrl, setNewThumbnailUrl] = useState<string | null>(null);

  const isVideo = recording.isVideo;

  const handleRecordingComplete = useCallback((blob: Blob, duration: number, transcript?: string) => {
    setNewMediaBlob(blob);
    setNewDuration(duration);
    setNewTranscript(transcript || null);
    if (isVideo) {
      setShowThumbnailSelector(true);
    }
  }, [isVideo]);

  const handleThumbnailSelected = useCallback((blob: Blob) => {
    setNewThumbnailBlob(blob);
    setShowThumbnailSelector(false);
  }, []);

  async function uploadBlob(blob: Blob, filename: string, contentType: string): Promise<string> {
    const presignedRes = await fetch("/api/upload/presigned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, contentType }),
    });
    if (!presignedRes.ok) throw new Error("Failed to get upload URL");
    const { uploadUrl, fileUrl } = await presignedRes.json();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": contentType },
    });
    if (!uploadRes.ok) throw new Error("Failed to upload file");
    return fileUrl;
  }

  async function handleThumbnailFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumbnail(true);
    setError(null);
    try {
      const filename = `thumbnail-${Date.now()}.${file.name.split(".").pop()}`;
      const url = await uploadBlob(file, filename, file.type);
      setNewThumbnailUrl(url);
    } catch (err) {
      setError("Failed to upload thumbnail");
      console.error(err);
    } finally {
      setUploadingThumbnail(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const updatePayload: Record<string, any> = {
        title: form.title,
        description: form.description,
        category: form.category,
      };

      // Upload new media if recorded
      if (newMediaBlob) {
        const ext = isVideo ? ".webm" : ".webm";
        const filename = `recording-${Date.now()}${ext}`;
        const contentType = newMediaBlob.type || (isVideo ? "video/webm" : "audio/webm");
        const mediaUrl = await uploadBlob(newMediaBlob, filename, contentType);
        updatePayload.mediaUrl = mediaUrl;
        updatePayload.durationSeconds = newDuration;
        updatePayload.transcription = newTranscript || null;
        updatePayload.transcriptionStatus = newTranscript ? "COMPLETED" : "NONE";

        // Upload new thumbnail if captured from video
        if (newThumbnailBlob) {
          const thumbFilename = `thumbnail-${Date.now()}.jpg`;
          const thumbUrl = await uploadBlob(newThumbnailBlob, thumbFilename, "image/jpeg");
          updatePayload.thumbnailUrl = thumbUrl;
        }
      }

      // Upload standalone thumbnail change (not from re-recording)
      if (newThumbnailUrl && !newMediaBlob) {
        updatePayload.thumbnailUrl = newThumbnailUrl;
      }

      const res = await fetch(`/api/recordings/${recording.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save recording");
      }

      const updated = await res.json();
      onSave(updated);
    } catch (err) {
      console.error("Error saving recording:", err);
      setError(err instanceof Error ? err.message : "Failed to save recording");
    } finally {
      setSaving(false);
    }
  }

  const transcriptionStatus = recording.transcriptionStatus;
  const hasTranscription = transcriptionStatus === "COMPLETED" && recording.transcription;
  const currentThumbnail = newThumbnailUrl || recording.thumbnailUrl;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900">Edit Recording</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Read-only metadata */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
        {recording.procedureType && (
          <span>Condition: <span className="text-gray-700 font-medium">{recording.procedureType}</span></span>
        )}
        {seriesInfo && (
          <span>
            Series:{" "}
            <a href={`/dashboard/guide/content`} className="text-purple-600 hover:text-purple-700 font-medium">
              {seriesInfo.seriesTitle}
            </a>
          </span>
        )}
      </div>

      {/* Editable fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="WEEKLY_TIMELINE">Timeline</option>
            <option value="WISH_I_KNEW">Wish I Knew</option>
            <option value="PRACTICAL_TIPS">Practical Tips</option>
            <option value="MENTAL_HEALTH">Mental Health</option>
            <option value="RETURN_TO_ACTIVITY">Return to Activity</option>
            <option value="MISTAKES_AND_LESSONS">Mistakes &amp; Lessons</option>
          </select>
        </div>
      </div>

      {/* Media section */}
      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Media</h4>
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
          <span className="font-medium">{isVideo ? "Video" : "Audio"}</span>
          <span className="text-gray-300">|</span>
          <span>{formatDuration(newDuration ?? recording.durationSeconds)}</span>
          {newMediaBlob && (
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">New recording ready</span>
          )}
        </div>

        {/* Playback */}
        {recording.mediaUrl && !newMediaBlob && (
          <div className="mb-3">
            {isVideo ? (
              <video
                src={recording.mediaUrl}
                controls
                className="w-full max-w-md rounded-lg border border-gray-200"
                preload="metadata"
              />
            ) : (
              <audio
                src={recording.mediaUrl}
                controls
                className="w-full max-w-md"
                preload="metadata"
              />
            )}
          </div>
        )}

        {newMediaBlob && (
          <div className="mb-3">
            <p className="text-xs text-teal-700 font-medium mb-1">New recording preview:</p>
            {isVideo ? (
              <video
                src={URL.createObjectURL(newMediaBlob)}
                controls
                className="w-full max-w-md rounded-lg border border-teal-200"
                preload="metadata"
              />
            ) : (
              <audio
                src={URL.createObjectURL(newMediaBlob)}
                controls
                className="w-full max-w-md"
                preload="metadata"
              />
            )}
          </div>
        )}

        {!showReplace && !showThumbnailSelector ? (
          <button
            onClick={() => setShowReplace(true)}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50"
          >
            Replace Recording
          </button>
        ) : showThumbnailSelector && newMediaBlob ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <ThumbnailSelector
              videoBlob={newMediaBlob}
              onThumbnailSelected={handleThumbnailSelected}
              onBack={() => {
                setShowThumbnailSelector(false);
                setNewMediaBlob(null);
                setNewDuration(null);
                setNewTranscript(null);
              }}
            />
          </div>
        ) : showReplace ? (
          <div className="bg-gray-50 rounded-lg p-4">
            {isVideo ? (
              <VideoRecorder onRecordingComplete={handleRecordingComplete} />
            ) : (
              <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
            )}
            <button
              onClick={() => {
                setShowReplace(false);
                setNewMediaBlob(null);
                setNewDuration(null);
                setNewTranscript(null);
              }}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel replacement
            </button>
          </div>
        ) : null}

        {/* Thumbnail (video only) */}
        {isVideo && (
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Thumbnail:</span>
              {currentThumbnail ? (
                <img
                  src={currentThumbnail}
                  alt="Thumbnail"
                  className="w-20 h-12 object-cover rounded border border-gray-200"
                />
              ) : (
                <span className="text-sm text-gray-400">No thumbnail</span>
              )}
              <label className="text-sm text-teal-600 hover:text-teal-700 font-medium cursor-pointer border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50">
                {uploadingThumbnail ? "Uploading..." : "Change Thumbnail"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleThumbnailFileChange}
                  className="hidden"
                  disabled={uploadingThumbnail}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Transcription section */}
      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Transcription</h4>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-600">Status:</span>
          {transcriptionStatus === "COMPLETED" ? (
            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Completed</span>
          ) : transcriptionStatus === "PENDING" ? (
            <span className="text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">Pending</span>
          ) : transcriptionStatus === "FAILED" ? (
            <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">Failed</span>
          ) : (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">None</span>
          )}
        </div>

        {hasTranscription ? (
          <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto text-sm text-gray-700 leading-relaxed">
            {recording.transcription}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No transcription available</p>
        )}

        {newTranscript && (
          <div className="mt-2">
            <p className="text-xs font-medium text-teal-700 mb-1">New transcription (from re-recording):</p>
            <div className="bg-teal-50 rounded-lg p-3 max-h-32 overflow-y-auto text-sm text-gray-700 leading-relaxed border border-teal-100">
              {newTranscript}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={saving || !form.title || uploadingThumbnail}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
