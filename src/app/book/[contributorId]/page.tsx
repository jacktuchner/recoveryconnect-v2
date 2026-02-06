"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default function BookCallPage() {
  const { contributorId } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contributor, setContributor] = useState<any>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: 30,
    questionsInAdvance: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    async function load() {
      try {
        const [contribRes, availRes] = await Promise.all([
          fetch(`/api/contributors/${contributorId}`),
          fetch(`/api/contributors/${contributorId}/availability`),
        ]);
        if (contribRes.ok) setContributor(await contribRes.json());
        if (availRes.ok) setAvailability(await availRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contributorId]);

  // Group availability by day for display
  const availabilityByDay = useMemo(() => {
    const grouped: Record<number, AvailabilitySlot[]> = {};
    availability.forEach((slot) => {
      if (!grouped[slot.dayOfWeek]) grouped[slot.dayOfWeek] = [];
      grouped[slot.dayOfWeek].push(slot);
    });
    return grouped;
  }, [availability]);

  const timezone = availability[0]?.timezone || "America/New_York";

  // Check if selected time falls within an available slot
  function isTimeAvailable(): boolean {
    if (!form.date || !form.time || availability.length === 0) return true; // Don't block if no availability data
    const selectedDate = new Date(`${form.date}T${form.time}`);
    const dayOfWeek = selectedDate.getDay();
    const selectedTime = form.time; // "HH:MM" format

    const slotsForDay = availabilityByDay[dayOfWeek];
    if (!slotsForDay || slotsForDay.length === 0) return false;

    return slotsForDay.some((slot) => {
      return selectedTime >= slot.startTime && selectedTime < slot.endTime;
    });
  }

  const timeAvailable = isTimeAvailable();
  const hasAvailability = availability.length > 0;
  const canBook = form.date && form.time && timeAvailable;

  async function handleBook() {
    if (!canBook) return;
    setBooking(true);
    setError(null);

    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();

      const res = await fetch("/api/checkout/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributorId,
          scheduledAt,
          durationMinutes: form.duration,
          questionsInAdvance: form.questionsInAdvance || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create checkout session");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8">Loading...</div>;
  if (!contributor) return <div className="max-w-2xl mx-auto px-4 py-8">Contributor not found.</div>;

  const rate = contributor.profile?.hourlyRate || 50;
  const price = form.duration === 60 ? rate : rate / 2;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={`/contributors/${contributorId}`} className="text-sm text-teal-600 hover:text-teal-700 mb-4 inline-block">
        &larr; Back to Profile
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-2">Book a Call</h1>
        <p className="text-gray-600 mb-6">Schedule a 1-on-1 video call with {contributor.name}</p>

        {/* Contributor summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
            <span className="text-teal-700 font-semibold text-lg">
              {contributor.name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <div>
            <p className="font-semibold">{contributor.name}</p>
            <p className="text-sm text-gray-500">
              {contributor.profile?.procedureType} &middot; {contributor.profile?.ageRange} &middot; {contributor.profile?.timeSinceSurgery} post-op
            </p>
          </div>
        </div>

        {/* Available Hours */}
        {hasAvailability && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-teal-900">Available Hours</h3>
              <span className="text-xs text-teal-600">({timezone})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(availabilityByDay)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([day, slots]) => (
                  <div key={day} className="text-sm">
                    <span className="font-medium text-teal-800">{DAY_NAMES[Number(day)]}</span>
                    <div className="text-teal-600">
                      {slots.map((slot, i) => (
                        <span key={slot.id}>
                          {i > 0 && ", "}
                          {formatTime12(slot.startTime)} - {formatTime12(slot.endTime)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Call Duration</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm(f => ({...f, duration: 30}))}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  form.duration === 30 ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                <p className="font-semibold">30 minutes</p>
                <p className="text-sm text-gray-500">${(rate / 2).toFixed(2)}</p>
              </button>
              <button type="button" onClick={() => setForm(f => ({...f, duration: 60}))}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  form.duration === 60 ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                <p className="font-semibold">60 minutes</p>
                <p className="text-sm text-gray-500">${rate.toFixed(2)}</p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={form.date}
                onChange={(e) => setForm(f => ({...f, date: e.target.value}))}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
              <input type="time" value={form.time}
                onChange={(e) => setForm(f => ({...f, time: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Availability warning */}
          {form.date && form.time && !timeAvailable && hasAvailability && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">Selected time is outside available hours</p>
                <p className="text-xs text-amber-600 mt-1">
                  {contributor.name} is not available at this time. Please choose a time within the available hours shown above.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Questions for the Contributor (optional)
            </label>
            <textarea value={form.questionsInAdvance}
              onChange={(e) => setForm(f => ({...f, questionsInAdvance: e.target.value}))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={4}
              placeholder="Share any specific questions you'd like to discuss so your contributor can prepare..." />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Total</span>
              <span className="text-2xl font-bold text-teal-700">${price.toFixed(2)}</span>
            </div>
            {error && (
              <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
            )}
            <button onClick={handleBook} disabled={booking || !canBook}
              className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {booking ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                `Proceed to Payment - $${price.toFixed(2)}`
              )}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              You will be redirected to Stripe to complete your payment securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
