"use client";

import { useState, useEffect } from "react";

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
];

// Generate time options in 30-minute increments
function generateTimeOptions() {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      const value = `${hour}:${minute}`;
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      const label = `${displayHour}:${minute} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export default function AvailabilityManager() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state for adding new slot
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 1, // Monday
    startTime: "09:00",
    endTime: "17:00",
    timezone: "America/New_York",
  });

  // Form state for blocking a date
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");

  useEffect(() => {
    loadSlots();
    loadBlockedDates();
  }, []);

  async function loadSlots() {
    try {
      const res = await fetch("/api/availability");
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (err) {
      console.error("Failed to load availability:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSlot),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add slot");
      }

      const slot = await res.json();
      setSlots((prev) => [...prev, slot].sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
      }));
      setSuccess("Availability slot added");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add slot");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSlot(slotId: string) {
    try {
      const res = await fetch(`/api/availability?id=${slotId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete slot");
      }

      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete slot");
    }
  }

  async function loadBlockedDates() {
    try {
      const res = await fetch("/api/availability/blocked-dates");
      if (res.ok) {
        setBlockedDates(await res.json());
      }
    } catch (err) {
      console.error("Failed to load blocked dates:", err);
    }
  }

  async function addBlockedDate(e: React.FormEvent) {
    e.preventDefault();
    if (!newBlockedDate) return;
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/availability/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newBlockedDate, reason: newBlockedReason || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to block date");
      }

      const blocked = await res.json();
      setBlockedDates((prev) => [...prev, blocked].sort((a, b) => a.date.localeCompare(b.date)));
      setNewBlockedDate("");
      setNewBlockedReason("");
      setSuccess("Date blocked — seekers won't see slots on this day");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to block date");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlockedDate(id: string) {
    try {
      const res = await fetch(`/api/availability/blocked-dates?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove blocked date");
      }

      setBlockedDates((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove blocked date");
    }
  }

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  /** Get tomorrow as YYYY-MM-DD */
  function getTomorrowStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }

  /** Get 2 weeks from now as YYYY-MM-DD */
  function getTwoWeeksStr() {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  }

  function formatTime(time: string) {
    const [h, m] = time.split(":").map(Number);
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? "AM" : "PM";
    return `${displayHour}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  // Group slots by day
  const slotsByDay = slots.reduce((acc, slot) => {
    if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {} as Record<number, AvailabilitySlot[]>);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-2">Availability Schedule</h2>
      <p className="text-sm text-gray-600 mb-6">
        Set the times when seekers can book calls with you. Seekers will only see available slots during these windows.
      </p>

      {error && (
        <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 rounded-lg p-3 text-sm mb-4">{success}</div>
      )}

      {/* Current Availability */}
      {slots.length > 0 ? (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Your availability</h3>
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((day, index) => {
              const daySlots = slotsByDay[index];
              if (!daySlots || daySlots.length === 0) return null;

              return (
                <div key={day} className="flex items-start gap-4 py-2 border-b border-gray-100 last:border-0">
                  <span className="w-24 text-sm font-medium text-gray-900">{day}</span>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {daySlots.map((slot) => (
                      <span
                        key={slot.id}
                        className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-sm"
                      >
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        <button
                          onClick={() => deleteSlot(slot.id)}
                          className="text-teal-500 hover:text-red-600 transition-colors"
                          title="Remove slot"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center mb-6">
          <p className="text-gray-500">No availability set yet. Add your first slot below.</p>
        </div>
      )}

      {/* Add New Slot Form */}
      <form onSubmit={addSlot} className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Add availability slot</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Day</label>
            <select
              value={newSlot.dayOfWeek}
              onChange={(e) => setNewSlot((prev) => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {DAYS_OF_WEEK.map((day, index) => (
                <option key={day} value={index}>{day}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
            <select
              value={newSlot.startTime}
              onChange={(e) => setNewSlot((prev) => ({ ...prev, startTime: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
            <select
              value={newSlot.endTime}
              onChange={(e) => setNewSlot((prev) => ({ ...prev, endTime: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Timezone</label>
            <select
              value={newSlot.timezone}
              onChange={(e) => setNewSlot((prev) => ({ ...prev, timezone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || newSlot.startTime >= newSlot.endTime}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
        >
          {saving ? "Adding..." : "Add Slot"}
        </button>
        {newSlot.startTime >= newSlot.endTime && (
          <span className="ml-3 text-sm text-red-600">End time must be after start time</span>
        )}
      </form>

      {/* Time Off / Blocked Dates Section */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-1">Time Off</h3>
        <p className="text-xs text-gray-500 mb-4">
          Block specific dates when you&apos;re unavailable. Seekers won&apos;t see any slots on these days.
        </p>

        {/* Existing blocked dates */}
        {blockedDates.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {blockedDates.map((bd) => (
              <span
                key={bd.id}
                className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-sm"
              >
                {formatDate(bd.date)}
                {bd.reason && (
                  <span className="text-red-400 text-xs">({bd.reason})</span>
                )}
                <button
                  onClick={() => deleteBlockedDate(bd.id)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add blocked date form */}
        <form onSubmit={addBlockedDate} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              min={getTomorrowStr()}
              max={getTwoWeeksStr()}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reason (optional)</label>
            <input
              type="text"
              value={newBlockedReason}
              onChange={(e) => setNewBlockedReason(e.target.value)}
              placeholder="e.g., Vacation"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !newBlockedDate}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? "Adding..." : "Block Date"}
          </button>
        </form>
      </div>
    </div>
  );
}
