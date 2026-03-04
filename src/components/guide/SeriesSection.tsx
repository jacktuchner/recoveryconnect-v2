"use client";

import { useState } from "react";
import SeriesForm from "@/components/SeriesForm";
import RecordingEditForm from "@/components/guide/RecordingEditForm";

interface SeriesSectionProps {
  series: any[];
  onSeriesUpdate: (series: any[]) => void;
  profileComplete?: boolean;
  allRecordings?: any[];
  onRecordingsUpdate?: (recordings: any[]) => void;
}

export default function SeriesSection({ series, onSeriesUpdate, profileComplete = true, allRecordings, onRecordingsUpdate }: SeriesSectionProps) {
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [editingSeries, setEditingSeries] = useState<any>(null);
  const [deletingSeries, setDeletingSeries] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [editingRecording, setEditingRecording] = useState<any>(null);
  const [deletingRecording, setDeletingRecording] = useState<string | null>(null);

  function toggleExpand(seriesId: string) {
    setExpandedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(seriesId)) next.delete(seriesId);
      else next.add(seriesId);
      return next;
    });
  }

  function getSeriesRecordings(s: any): any[] {
    const seriesRecIds = new Set(
      (s.recordings || []).map((r: any) => (typeof r === "string" ? r : r.id)).filter(Boolean)
    );
    return (allRecordings || []).filter((r: any) => seriesRecIds.has(r.id));
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
    try {
      const res = await fetch(`/api/series/${updatedSeries.id}`);
      if (res.ok) {
        const fullSeries = await res.json();
        onSeriesUpdate(series.map((s) => (s.id === updatedSeries.id ? fullSeries : s)));
      }
    } catch {
      onSeriesUpdate(series.map((s) => (s.id === updatedSeries.id ? updatedSeries : s)));
    }
    setEditingSeries(null);
    setShowSeriesForm(false);
  }

  async function deleteSeries(seriesId: string) {
    if (!confirm("Are you sure you want to delete this series? This cannot be undone.")) return;
    setDeletingSeries(seriesId);
    try {
      const res = await fetch(`/api/series/${seriesId}`, { method: "DELETE" });
      if (res.ok) {
        onSeriesUpdate(series.filter((s) => s.id !== seriesId));
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
        onSeriesUpdate(series.map((s) => (s.id === seriesId ? { ...s, status: newStatus } : s)));
      }
    } catch (err) {
      console.error("Error updating series status:", err);
    }
  }

  async function deleteRecording(recordingId: string) {
    if (!confirm("Are you sure you want to delete this recording? This cannot be undone.")) return;
    if (!onRecordingsUpdate || !allRecordings) return;
    setDeletingRecording(recordingId);
    try {
      const res = await fetch(`/api/recordings/${recordingId}`, { method: "DELETE" });
      if (res.ok) {
        onRecordingsUpdate(allRecordings.filter((r) => r.id !== recordingId));
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
          <h2 className="text-xl font-bold">Your Series</h2>
          <p className="text-sm text-gray-500 mt-1">Bundle related recordings into a series</p>
        </div>
        <div className="relative group">
          <button
            onClick={() => profileComplete && (() => { setEditingSeries(null); setShowSeriesForm(!showSeriesForm); })()}
            disabled={!profileComplete}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + New Series
          </button>
          {!profileComplete && (
            <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-48 z-10">
              Complete your profile before creating series
            </div>
          )}
        </div>
      </div>

      {showSeriesForm && (
        <div className="mb-6">
          <SeriesForm
            initialData={editingSeries}
            onSuccess={(updatedSeries) => {
              if (editingSeries) {
                handleSeriesUpdate(updatedSeries);
              } else {
                onSeriesUpdate([updatedSeries, ...series]);
                setShowSeriesForm(false);
              }
            }}
            onCancel={() => { setEditingSeries(null); setShowSeriesForm(false); }}
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
          <p className="text-sm text-gray-400">Bundle 2 or more related recordings into a series. Once a series has at least 2 recordings, you can publish it.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {series.map((s: any) => {
            const seriesRecs = getSeriesRecordings(s);
            const recordingCount = seriesRecs.length;
            const isExpanded = expandedSeries.has(s.id);
            const isDeleting = deletingSeries === s.id;

            return (
              <div key={s.id}>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <button onClick={() => toggleExpand(s.id)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                    <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple-700">{recordingCount}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.title}</p>
                      <p className="text-sm text-gray-500">{s.procedureType} &middot; {recordingCount} recording{recordingCount !== 1 ? "s" : ""}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 ml-4">
                    {s.status === "DRAFT" ? (
                      recordingCount >= 2 ? (
                        <>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">Ready to publish</span>
                          <button onClick={() => updateSeriesStatus(s.id, "PUBLISHED")} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium">Publish Now</button>
                        </>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">DRAFT</span>
                      )
                    ) : (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{s.status}</span>
                    )}
                    {s.status === "PUBLISHED" && (
                      <button onClick={() => updateSeriesStatus(s.id, "DRAFT")} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg hover:bg-gray-200 font-medium">Unpublish</button>
                    )}
                    <button onClick={() => startEditingSeries(s.id)} className="text-xs text-purple-600 hover:text-purple-700 font-medium px-2 py-1">Edit</button>
                    <button onClick={() => deleteSeries(s.id)} disabled={isDeleting} className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 disabled:opacity-50">{isDeleting ? "..." : "Delete"}</button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-8 mt-2 space-y-2 mb-3">
                    {s.status === "DRAFT" && recordingCount < 2 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-amber-800">This series needs at least 2 recordings to publish</p>
                          <p className="text-xs text-amber-600 mt-0.5">Add {2 - recordingCount} more recording{2 - recordingCount > 1 ? "s" : ""} to make it available to seekers.</p>
                        </div>
                      </div>
                    )}

                    {seriesRecs.map((rec: any) => {
                      const isEditingThis = editingRecording?.id === rec.id;
                      const isDeletingThis = deletingRecording === rec.id;

                      if (isEditingThis) {
                        return (
                          <RecordingEditForm
                            key={rec.id}
                            recording={editingRecording}
                            seriesInfo={{ seriesId: s.id, seriesTitle: s.title }}
                            onSave={(updated) => {
                              if (onRecordingsUpdate && allRecordings) {
                                onRecordingsUpdate(allRecordings.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
                              }
                              setEditingRecording(null);
                            }}
                            onCancel={() => setEditingRecording(null)}
                          />
                        );
                      }

                      return (
                        <div key={rec.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{rec.title}</p>
                            <p className="text-xs text-gray-500">
                              {rec.category?.replace(/_/g, " ")}
                              {rec.procedureType && <> &middot; {rec.procedureType}</>}
                              {" "}&middot; {rec.viewCount || 0} views
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rec.status === "PUBLISHED" ? "bg-green-100 text-green-700" : rec.status === "PENDING_REVIEW" ? "bg-yellow-100 text-yellow-700" : rec.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{rec.status?.replace(/_/g, " ")}</span>
                            <button onClick={() => setEditingRecording({ ...rec })} className="text-xs text-teal-600 hover:text-teal-700 font-medium px-2 py-1">Edit</button>
                            <button onClick={() => deleteRecording(rec.id)} disabled={isDeletingThis} className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 disabled:opacity-50">{isDeletingThis ? "..." : "Delete"}</button>
                          </div>
                        </div>
                      );
                    })}

                    {seriesRecs.length === 0 && (
                      <p className="text-sm text-gray-400 py-2 pl-2">No recordings in this series yet. Edit the series to add recordings.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
