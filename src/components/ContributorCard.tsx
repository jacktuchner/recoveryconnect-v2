import Link from "next/link";

interface ContributorCardProps {
  id: string;
  name: string;
  procedureType: string;
  ageRange: string;
  activityLevel: string;
  recoveryGoals: string[];
  timeSinceSurgery?: string | null;
  recordingCount: number;
  averageRating?: number;
  reviewCount: number;
  hourlyRate?: number | null;
  isAvailableForCalls: boolean;
  matchScore?: number;
}

const activityLabels: Record<string, string> = {
  SEDENTARY: "Sedentary",
  LIGHTLY_ACTIVE: "Lightly Active",
  MODERATELY_ACTIVE: "Moderately Active",
  ACTIVE: "Active",
  ATHLETE: "Athlete",
  // Legacy values for backwards compatibility
  RECREATIONAL: "Moderately Active",
  COMPETITIVE_ATHLETE: "Athlete",
  PROFESSIONAL_ATHLETE: "Athlete",
};

export default function ContributorCard({
  id, name, procedureType, ageRange, activityLevel, recoveryGoals,
  timeSinceSurgery, recordingCount, averageRating, reviewCount,
  hourlyRate, isAvailableForCalls, matchScore,
}: ContributorCardProps) {
  return (
    <Link href={`/contributors/${id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-teal-200 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-700 font-semibold text-lg">
                {name?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                {name}
              </h3>
              <p className="text-sm text-gray-500">{procedureType}</p>
            </div>
          </div>
          {matchScore !== undefined && (
            <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
              matchScore >= 80 ? "bg-green-100 text-green-700" :
              matchScore >= 60 ? "bg-yellow-100 text-yellow-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {matchScore}% match
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ageRange}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{activityLabels[activityLevel] || activityLevel}</span>
          {timeSinceSurgery && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{timeSinceSurgery} post-op</span>
          )}
        </div>

        {recoveryGoals.length > 0 && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-1">
            Goals: {recoveryGoals.join(", ")}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{recordingCount} recordings</span>
            {averageRating !== undefined && reviewCount > 0 && (
              <span className="flex items-center gap-0.5">
                <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {averageRating.toFixed(1)} ({reviewCount})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAvailableForCalls && hourlyRate && (
              <span className="text-sm font-semibold text-teal-700">
                ${(hourlyRate / 2).toFixed(0)}/30min
              </span>
            )}
            {isAvailableForCalls && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Available for calls
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
