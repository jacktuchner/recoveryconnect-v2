"use client";

import { useState, useEffect } from "react";

interface Report {
  id: string;
  contentType: string;
  contentId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
}

const REASON_LABELS: Record<string, string> = {
  medical_advice: "Contains medical advice",
  harmful_content: "Potentially harmful",
  contradicts_doctors: "Contradicts doctors",
  inappropriate: "Inappropriate content",
  misinformation: "Misinformation",
  other: "Other",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [filter]);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(id: string, action: "RESOLVED" | "DISMISSED") {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to update report:", err);
    } finally {
      setActionLoading(null);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Content Reports</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="PENDING">Pending</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
          <option value="">All</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No reports found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        report.contentType === "recording"
                          ? "bg-purple-100 text-purple-700"
                          : report.contentType === "call"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {report.contentType}
                    </span>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        report.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : report.status === "RESOLVED"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <p className="font-medium text-gray-900 mb-1">
                    {REASON_LABELS[report.reason] || report.reason}
                  </p>

                  {report.details && (
                    <p className="text-sm text-gray-600 mb-3">{report.details}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Reported by: {report.reporter?.name || "Unknown"}</span>
                    <span>•</span>
                    <span>{formatDate(report.createdAt)}</span>
                    <span>•</span>
                    <span className="text-xs text-gray-400">ID: {report.contentId}</span>
                  </div>
                </div>

                {/* Actions */}
                {report.status === "PENDING" && (
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleResolve(report.id, "RESOLVED")}
                      disabled={actionLoading === report.id}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === report.id ? "..." : "Resolve"}
                    </button>
                    <button
                      onClick={() => handleResolve(report.id, "DISMISSED")}
                      disabled={actionLoading === report.id}
                      className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
