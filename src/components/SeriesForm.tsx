"use client";

import { useState, useEffect } from "react";
import { PROCEDURE_TYPES } from "@/lib/constants";

interface Recording {
  id: string;
  title: string;
  price: number;
  status: string;
  procedureType: string;
}

interface SeriesFormProps {
  initialData?: {
    id?: string;
    title: string;
    description: string;
    procedureType: string;
    discountPercent: number;
    recordingIds: string[];
    status?: string;
  };
  onSuccess: (series: any) => void;
  onCancel: () => void;
}

export default function SeriesForm({ initialData, onSuccess, onCancel }: SeriesFormProps) {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    procedureType: initialData?.procedureType || "",
    discountPercent: initialData?.discountPercent || 15,
  });
  const [selectedRecordingIds, setSelectedRecordingIds] = useState<string[]>(
    initialData?.recordingIds || []
  );
  const [availableRecordings, setAvailableRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData?.id;

  // Fetch contributor's recordings
  useEffect(() => {
    async function loadRecordings() {
      try {
        const res = await fetch("/api/recordings/mine");
        if (res.ok) {
          const recordings = await res.json();
          // Filter to only published recordings
          setAvailableRecordings(
            recordings.filter((r: Recording) => r.status === "PUBLISHED")
          );
        }
      } catch (err) {
        console.error("Failed to load recordings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRecordings();
  }, []);

  // Filter recordings by selected procedure type
  const filteredRecordings = form.procedureType
    ? availableRecordings.filter((r) => r.procedureType === form.procedureType)
    : availableRecordings;

  // Calculate pricing preview
  const selectedRecordings = availableRecordings.filter((r) =>
    selectedRecordingIds.includes(r.id)
  );
  const totalValue = selectedRecordings.reduce((sum, r) => sum + r.price, 0);
  const discountedPrice = totalValue * (1 - form.discountPercent / 100);
  const savings = totalValue - discountedPrice;

  function toggleRecording(recordingId: string) {
    setSelectedRecordingIds((prev) =>
      prev.includes(recordingId)
        ? prev.filter((id) => id !== recordingId)
        : [...prev, recordingId]
    );
  }

  function moveRecording(index: number, direction: "up" | "down") {
    const newOrder = [...selectedRecordingIds];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setSelectedRecordingIds(newOrder);
  }

  async function handleSubmit() {
    if (!form.title || !form.procedureType) {
      setError("Title and procedure type are required");
      return;
    }

    if (selectedRecordingIds.length < 2) {
      setError("Please select at least 2 recordings for a series");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const url = isEditing ? `/api/series/${initialData.id}` : "/api/series";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          procedureType: form.procedureType,
          discountPercent: form.discountPercent,
          recordingIds: selectedRecordingIds,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save series");
      }

      const series = await res.json();
      onSuccess(series);
    } catch (err) {
      console.error("Error saving series:", err);
      setError(err instanceof Error ? err.message : "Failed to save series");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center py-8">Loading your recordings...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {isEditing ? "Edit Series" : "Create New Series"}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Series Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Complete ACL Recovery Timeline (Weeks 1-8)"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            placeholder="Describe what patients will learn from this series..."
          />
        </div>

        {/* Procedure Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Procedure Type *
          </label>
          <select
            value={form.procedureType}
            onChange={(e) => {
              setForm((f) => ({ ...f, procedureType: e.target.value }));
              // Clear selected recordings when procedure changes
              setSelectedRecordingIds([]);
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select procedure...</option>
            {PROCEDURE_TYPES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Discount Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bundle Discount: {form.discountPercent}%
          </label>
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={form.discountPercent}
            onChange={(e) =>
              setForm((f) => ({ ...f, discountPercent: parseInt(e.target.value) }))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5%</span>
            <span>30%</span>
          </div>
        </div>

        {/* Recording Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Recordings ({selectedRecordingIds.length} selected)
          </label>
          {form.procedureType ? (
            filteredRecordings.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">
                No published recordings found for {form.procedureType}. Create some recordings first!
              </p>
            ) : (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {filteredRecordings.map((recording) => {
                  const isSelected = selectedRecordingIds.includes(recording.id);
                  return (
                    <label
                      key={recording.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${
                        isSelected ? "bg-purple-50" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRecording(recording.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {recording.title}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">
                        ${recording.price.toFixed(2)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )
          ) : (
            <p className="text-sm text-gray-500 py-4">
              Select a procedure type first to see available recordings.
            </p>
          )}
        </div>

        {/* Ordering */}
        {selectedRecordingIds.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recording Order (drag to reorder)
            </label>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {selectedRecordingIds.map((id, index) => {
                const recording = availableRecordings.find((r) => r.id === id);
                if (!recording) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 p-3 bg-white"
                  >
                    <span className="text-sm font-medium text-gray-400 w-6">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {recording.title}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveRecording(index, "up")}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRecording(index, "down")}
                        disabled={index === selectedRecordingIds.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing Preview */}
        {selectedRecordingIds.length >= 2 && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-900 mb-2">Pricing Preview</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Individual total:</span>
                <span className="text-gray-600">${totalValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bundle discount ({form.discountPercent}%):</span>
                <span className="text-green-600">-${savings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t border-purple-200">
                <span className="text-purple-900">Bundle price:</span>
                <span className="text-purple-700">${discountedPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || selectedRecordingIds.length < 2}
            className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Series"}
          </button>
        </div>
      </div>
    </div>
  );
}
