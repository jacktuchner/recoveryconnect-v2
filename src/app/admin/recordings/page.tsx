"use client";

import { useState, useEffect } from "react";

interface Recording {
  id: string;
  title: string;
  description: string;
  category: string;
  mediaUrl: string;
  durationSeconds: number;
  isVideo: boolean;
  status: string;
  procedureType: string;
  transcription: string | null;
  createdAt: string;
  contributor: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminRecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING_REVIEW");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewRecording, setPreviewRecording] = useState<Recording | null>(null);
  const [rejectModal, setRejectModal] = useState<Recording | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadRecordings();
  }, [filter]);

  async function loadRecordings() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/recordings?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setRecordings(data.recordings || []);
      }
    } catch (err) {
      console.error("Failed to load recordings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/recordings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      if (res.ok) {
        setRecordings((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to approve:", err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    try {
      const res = await fetch(`/api/admin/recordings/${rejectModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", reason: rejectReason }),
      });
      if (res.ok) {
        setRecordings((prev) => prev.filter((r) => r.id !== rejectModal.id));
        setRejectModal(null);
        setRejectReason("");
      }
    } catch (err) {
      console.error("Failed to reject:", err);
    } finally {
      setActionLoading(null);
    }
  }

  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recording Review</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="PUBLISHED">Published</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent" />
        </div>
      ) : recordings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No recordings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recordings.map((recording) => (
            <div
              key={recording.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{recording.title}</h3>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        recording.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : recording.status === "PENDING_REVIEW"
                          ? "bg-yellow-100 text-yellow-700"
                          : recording.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {recording.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>By: {recording.contributor?.name || "Unknown"}</span>
                    <span>•</span>
                    <span>{recording.category.replace(/_/g, " ")}</span>
                    <span>•</span>
                    <span>{recording.procedureType}</span>
                    <span>•</span>
                    <span>{formatDuration(recording.durationSeconds)}</span>
                    <span>•</span>
                    <span>{formatDate(recording.createdAt)}</span>
                  </div>

                  {recording.description && (
                    <p className="text-sm text-gray-600 mb-3">{recording.description}</p>
                  )}

                  {recording.transcription && (
                    <details className="mb-3">
                      <summary className="text-sm text-teal-600 cursor-pointer hover:text-teal-700">
                        View Transcript
                      </summary>
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {recording.transcription}
                      </p>
                    </details>
                  )}

                  {/* Media Preview */}
                  <div className="mt-3">
                    {recording.isVideo ? (
                      <video
                        src={recording.mediaUrl}
                        controls
                        className="w-full max-w-md rounded-lg"
                      />
                    ) : (
                      <audio src={recording.mediaUrl} controls className="w-full max-w-md" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                {recording.status === "PENDING_REVIEW" && (
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(recording.id)}
                      disabled={actionLoading === recording.id}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === recording.id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => setRejectModal(recording)}
                      disabled={actionLoading === recording.id}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject Recording</h3>
            <p className="text-sm text-gray-600 mb-4">
              Rejecting: <strong>{rejectModal.title}</strong>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.id}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === rejectModal.id ? "Rejecting..." : "Reject Recording"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
