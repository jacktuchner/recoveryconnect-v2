"use client";

import { useState, useEffect } from "react";

interface EligibleGuide {
  id: string;
  name: string | null;
  image: string | null;
  hasShare: boolean;
}

export default function JournalSharingManager() {
  const [guides, setGuides] = useState<EligibleGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShares() {
      try {
        const res = await fetch("/api/journal/shares");
        if (res.ok) {
          const data = await res.json();
          setGuides(data.eligibleGuides || []);
        }
      } catch (err) {
        console.error("Error fetching journal shares:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchShares();
  }, []);

  async function toggleShare(guideId: string, currentlyShared: boolean) {
    setToggling(guideId);
    try {
      const res = await fetch("/api/journal/shares", {
        method: currentlyShared ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributorId: guideId }),
      });
      if (res.ok) {
        setGuides((prev) =>
          prev.map((c) =>
            c.id === guideId ? { ...c, hasShare: !currentlyShared } : c
          )
        );
      }
    } catch (err) {
      console.error("Error toggling journal share:", err);
    } finally {
      setToggling(null);
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Loading sharing settings...</div>
    );
  }

  if (guides.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Complete a call with a guide to share your journal with them.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Choose which guides can view your shared journal entries.
      </p>
      {guides.map((guide) => (
        <div
          key={guide.id}
          className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-200 bg-gray-50"
        >
          <div className="flex items-center gap-3">
            {guide.image ? (
              <img
                src={guide.image}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-teal-700 text-sm font-medium">
                  {guide.name?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
            )}
            <span className="text-sm font-medium text-gray-900">
              {guide.name || "Guide"}
            </span>
          </div>
          <button
            onClick={() => toggleShare(guide.id, guide.hasShare)}
            disabled={toggling === guide.id}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 ${
              guide.hasShare ? "bg-teal-600" : "bg-gray-300"
            }`}
            role="switch"
            aria-checked={guide.hasShare}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                guide.hasShare ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
