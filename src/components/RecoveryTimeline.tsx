"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface TimelineRecording {
  id: string;
  title: string;
  description?: string;
  procedureType: string;
  durationSeconds?: number;
  price: number;
  weekNumber?: number;
  contributor?: {
    name: string;
  };
}

interface RecoveryTimelineProps {
  procedureType?: string;
  currentWeek?: number;
}

const WEEK_MARKERS = [1, 2, 3, 4, 6, 8, 10, 12];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function RecoveryTimeline({ procedureType, currentWeek }: RecoveryTimelineProps) {
  const [recordings, setRecordings] = useState<TimelineRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  useEffect(() => {
    async function fetchTimelineRecordings() {
      try {
        const params = new URLSearchParams();
        params.set("category", "WEEKLY_TIMELINE");
        if (procedureType) params.set("procedure", procedureType);
        params.set("limit", "50");

        const res = await fetch(`/api/recordings?${params}`);
        if (res.ok) {
          const data = await res.json();
          // Parse week numbers from titles (e.g., "Week 2: ..." or "Week 2 -")
          const enrichedRecordings = (data.recordings || []).map((rec: any) => {
            const weekMatch = rec.title.match(/week\s*(\d+)/i);
            return {
              ...rec,
              weekNumber: weekMatch ? parseInt(weekMatch[1]) : null,
            };
          });
          setRecordings(enrichedRecordings);
        }
      } catch (err) {
        console.error("Error fetching timeline recordings:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTimelineRecordings();
  }, [procedureType]);

  // Group recordings by week
  const recordingsByWeek: Record<number, TimelineRecording[]> = {};
  recordings.forEach((rec) => {
    if (rec.weekNumber) {
      if (!recordingsByWeek[rec.weekNumber]) {
        recordingsByWeek[rec.weekNumber] = [];
      }
      recordingsByWeek[rec.weekNumber].push(rec);
    }
  });

  const weeksWithContent = WEEK_MARKERS.filter((week) => recordingsByWeek[week]?.length > 0);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">Recovery Timeline</h2>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 rounded mb-4"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">Recovery Timeline</h2>
        <p className="text-gray-500 text-sm">
          No timeline recordings available yet for {procedureType || "your procedure"}.
          Check back soon as contributors add new content.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recovery Timeline</h2>
        {procedureType && (
          <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full">
            {procedureType}
          </span>
        )}
      </div>

      {/* Horizontal Timeline */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex items-center gap-1 min-w-max">
          {WEEK_MARKERS.map((week, index) => {
            const hasContent = recordingsByWeek[week]?.length > 0;
            const isCurrentWeek = currentWeek === week;
            const isSelected = selectedWeek === week;
            const isPast = currentWeek ? week < currentWeek : false;

            return (
              <div key={week} className="flex items-center">
                {/* Week Marker */}
                <button
                  onClick={() => hasContent && setSelectedWeek(isSelected ? null : week)}
                  disabled={!hasContent}
                  className={`
                    flex flex-col items-center px-3 py-2 rounded-lg transition-all
                    ${isSelected ? "bg-teal-100 ring-2 ring-teal-500" : ""}
                    ${hasContent ? "cursor-pointer hover:bg-gray-100" : "cursor-default opacity-50"}
                    ${isCurrentWeek ? "ring-2 ring-cyan-400" : ""}
                  `}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${isCurrentWeek ? "bg-cyan-500 text-white" : ""}
                      ${isPast && !isCurrentWeek ? "bg-teal-500 text-white" : ""}
                      ${!isPast && !isCurrentWeek ? "bg-gray-200 text-gray-600" : ""}
                      ${hasContent && !isCurrentWeek && !isPast ? "bg-teal-100 text-teal-700" : ""}
                    `}
                  >
                    {week}
                  </div>
                  <span className="text-xs text-gray-500 mt-1">Week</span>
                  {hasContent && (
                    <span className="text-[10px] text-teal-600 font-medium">
                      {recordingsByWeek[week].length} video{recordingsByWeek[week].length !== 1 ? "s" : ""}
                    </span>
                  )}
                </button>

                {/* Connector Line */}
                {index < WEEK_MARKERS.length - 1 && (
                  <div
                    className={`w-6 h-0.5 ${
                      isPast ? "bg-teal-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}

          {/* 12+ weeks indicator */}
          <div className="flex items-center">
            <div className="w-6 h-0.5 bg-gray-200" />
            <div className="flex flex-col items-center px-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-500">
                12+
              </div>
              <span className="text-xs text-gray-400 mt-1">Beyond</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Week Indicator */}
      {currentWeek && (
        <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
          <p className="text-sm text-cyan-700">
            <span className="font-semibold">You are at Week {currentWeek}</span>
            {weeksWithContent.includes(currentWeek) && (
              <span> - Click to see what others experienced this week</span>
            )}
          </p>
        </div>
      )}

      {/* Selected Week Content */}
      {selectedWeek && recordingsByWeek[selectedWeek] && (
        <div className="mt-4">
          <h3 className="font-semibold text-gray-900 mb-3">Week {selectedWeek} Content</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {recordingsByWeek[selectedWeek].map((rec) => (
              <Link
                key={rec.id}
                href={`/recordings/${rec.id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 group-hover:text-teal-700 text-sm line-clamp-2">
                    {rec.title}
                  </h4>
                  <span className="text-sm font-semibold text-teal-700 flex-shrink-0 ml-2">
                    ${rec.price.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  By {rec.contributor?.name || "Anonymous"}
                  {rec.durationSeconds && ` · ${formatDuration(rec.durationSeconds)}`}
                </p>
                {rec.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">{rec.description}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No Selection Prompt */}
      {!selectedWeek && weeksWithContent.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          Click on a week marker to see recovery content for that stage.
        </p>
      )}

      {/* Browse All Link */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <Link
          href={`/watch?category=WEEKLY_TIMELINE${procedureType ? `&procedure=${encodeURIComponent(procedureType)}` : ""}`}
          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          Browse all timeline recordings →
        </Link>
      </div>
    </div>
  );
}
