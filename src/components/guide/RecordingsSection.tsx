"use client";

import { useState } from "react";
import RecordingForm from "@/components/RecordingForm";
import GuideGuidelines from "@/components/GuideGuidelines";
import RecordingEditForm from "@/components/guide/RecordingEditForm";

interface RecordingsSectionProps {
  recordings: any[];
  onRecordingsUpdate: (recordings: any[]) => void;
  profileComplete?: boolean;
  draftSeries?: any[];
  recordingSeriesMap?: Map<string, { seriesId: string; seriesTitle: string }>;
}

export default function RecordingsSection({ recordings, onRecordingsUpdate, profileComplete = true, draftSeries, recordingSeriesMap }: RecordingsSectionProps) {
  const [showRecordingForm, setShowRecordingForm] = useState(false);
  const [editingRecording, setEditingRecording] = useState<any>(null);
  const [deletingRecording, setDeletingRecording] = useState<string | null>(null);
  const [addToSeriesPrompt, setAddToSeriesPrompt] = useState<{ recordingId: string; recordingTitle: string } | null>(null);
  const [addingToSeries, setAddingToSeries] = useState(false);

  function handleRecordingSuccess(recording: Record<string, unknown>) {
    onRecordingsUpdate([recording, ...recordings]);
    setShowRecordingForm(false);

    // Prompt to add to a draft series if any exist
    if (draftSeries && draftSeries.length > 0) {
      setAddToSeriesPrompt({ recordingId: recording.id as string, recordingTitle: recording.title as string });
    }
  }

  async function addRecordingToSeries(seriesId: string) {
    if (!addToSeriesPrompt) return;
    setAddingToSeries(true);
    try {
      // Get current series recordings to determine next sequence number
      const seriesRes = await fetch(`/api/series/${seriesId}`);
      if (!seriesRes.ok) throw new Error("Failed to load series");
      const seriesData = await seriesRes.json();
      const currentIds = seriesData.recordings?.map((r: any) => r.id) || [];
      const newIds = [...currentIds, addToSeriesPrompt.recordingId];

      const res = await fetch(`/api/series/${seriesId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordingIds: newIds }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to add recording to series");
      }
    } catch (err) {
      console.error("Error adding to series:", err);
    } finally {
      setAddingToSeries(false);
      setAddToSeriesPrompt(null);
    }
  }

  async function deleteRecording(recordingId: string) {
    if (!confirm("Are you sure you want to delete this recording? This cannot be undone.")) return;
    setDeletingRecording(recordingId);
    try {
      const res = await fetch(`/api/recordings/${recordingId}`, { method: "DELETE" });
      if (res.ok) {
        onRecordingsUpdate(recordings.filter((r) => r.id !== recordingId));
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

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Your Recordings</h2>
          <p className="text-sm text-gray-500 mt-1">Standalone recordings not yet part of a series</p>
        </div>
        <div className="relative group">
          <button
            onClick={() => profileComplete && setShowRecordingForm(!showRecordingForm)}
            disabled={!profileComplete}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + New Recording
          </button>
          {!profileComplete && (
            <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-48 z-10">
              Complete your profile before creating recordings
            </div>
          )}
        </div>
      </div>

      {addToSeriesPrompt && (
        <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm font-medium text-purple-800 mb-2">
            Add &ldquo;{addToSeriesPrompt.recordingTitle}&rdquo; to a series?
          </p>
          <div className="flex flex-wrap gap-2">
            {draftSeries?.map((s: any) => (
              <button
                key={s.id}
                onClick={() => addRecordingToSeries(s.id)}
                disabled={addingToSeries}
                className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {s.title}
              </button>
            ))}
            <button
              onClick={() => setAddToSeriesPrompt(null)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {showRecordingForm && (
        <GuideGuidelines>
          <div className="mb-6">
            <RecordingForm onSuccess={handleRecordingSuccess} onCancel={() => setShowRecordingForm(false)} />
          </div>
        </GuideGuidelines>
      )}

      {(() => {
        const standaloneRecordings = recordingSeriesMap
          ? recordings.filter((r: any) => !recordingSeriesMap.has(r.id))
          : recordings;

        if (standaloneRecordings.length === 0 && !showRecordingForm) {
          return (
            <p className="text-gray-500 text-center py-8">
              {recordings.length === 0 ? "No recordings yet. Create your first one!" : "All your recordings are part of a series."}
            </p>
          );
        }

        return (
        <div className="space-y-3">
          {standaloneRecordings.map((rec: any) => {
            const isEditing = editingRecording?.id === rec.id;
            const isDeleting = deletingRecording === rec.id;

            if (isEditing) {
              return (
                <RecordingEditForm
                  key={rec.id}
                  recording={editingRecording}
                  seriesInfo={recordingSeriesMap?.get(rec.id)}
                  onSave={(updated) => {
                    onRecordingsUpdate(recordings.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
                    setEditingRecording(null);
                  }}
                  onCancel={() => setEditingRecording(null)}
                />
              );
            }

            return (
              <div key={rec.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{rec.title}</p>
                  <p className="text-sm text-gray-500">
                    {rec.category.replace(/_/g, " ")}
                    {rec.procedureType && <> &middot; {rec.procedureType}</>}
                    {" "}&middot; {rec.viewCount} views
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${rec.status === "PUBLISHED" ? "bg-green-100 text-green-700" : rec.status === "PENDING_REVIEW" ? "bg-yellow-100 text-yellow-700" : rec.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{rec.status.replace(/_/g, " ")}</span>
                  <button onClick={() => setEditingRecording({ ...rec })} className="text-xs text-teal-600 hover:text-teal-700 font-medium px-2 py-1">Edit</button>
                  <button onClick={() => deleteRecording(rec.id)} disabled={isDeleting} className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 disabled:opacity-50">{isDeleting ? "..." : "Delete"}</button>
                </div>
              </div>
            );
          })}
        </div>
        );
      })()}
    </section>
  );
}
