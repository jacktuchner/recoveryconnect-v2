"use client";

import Link from "next/link";

interface SeriesCardProps {
  id: string;
  title: string;
  contributorName: string;
  procedureType: string;
  recordingCount: number;
  totalValue: number;
  discountedPrice: number;
  discountPercent: number;
  totalDuration?: number;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins} min`;
}

export default function SeriesCard({
  id,
  title,
  contributorName,
  procedureType,
  recordingCount,
  totalValue,
  discountedPrice,
  discountPercent,
  totalDuration,
}: SeriesCardProps) {
  const savings = totalValue - discountedPrice;

  return (
    <Link href={`/series/${id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              Series
            </span>
            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Save {discountPercent}%
            </span>
          </div>
          <div className="flex items-center justify-center h-16">
            <div className="flex -space-x-2">
              {[...Array(Math.min(3, recordingCount))].map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-lg bg-white border-2 border-purple-200 flex items-center justify-center shadow-sm"
                  style={{ zIndex: 3 - i }}
                >
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              ))}
              {recordingCount > 3 && (
                <div
                  className="w-10 h-10 rounded-lg bg-purple-100 border-2 border-purple-200 flex items-center justify-center text-xs font-semibold text-purple-700"
                  style={{ zIndex: 0 }}
                >
                  +{recordingCount - 3}
                </div>
              )}
            </div>
          </div>
          {totalDuration && (
            <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
              {formatDuration(totalDuration)}
            </span>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2 mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mb-3">{contributorName}</p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {procedureType}
            </span>
            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
              {recordingCount} recordings
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-400 line-through mr-2">${totalValue.toFixed(2)}</span>
              <span className="font-semibold text-purple-700">${discountedPrice.toFixed(2)}</span>
            </div>
            <span className="text-xs text-green-600 font-medium">
              Save ${savings.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
