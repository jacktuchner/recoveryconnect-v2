"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface FeaturedRecording {
  id: string;
  title: string;
  description?: string;
  category: string;
  procedureType: string;
  ageRange: string;
  activityLevel: string;
  durationSeconds?: number;
  isVideo: boolean;
  viewCount: number;
  contributor?: {
    id: string;
    name: string;
  };
  averageRating?: number;
  reviewCount: number;
}

const categoryLabels: Record<string, string> = {
  WEEKLY_TIMELINE: "Timeline",
  WISH_I_KNEW: "Wish I Knew",
  PRACTICAL_TIPS: "Tips",
  MENTAL_HEALTH: "Mental Health",
  RETURN_TO_ACTIVITY: "Return to Activity",
  MISTAKES_AND_LESSONS: "Lessons",
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function PreviewCard({ recording }: { recording: FeaturedRecording }) {
  return (
    <Link href={`/recordings/${recording.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden group relative hover:border-teal-300 hover:shadow-md transition-all">
        {/* Content preview */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              {recording.isVideo ? "Video" : "Audio"}
            </span>
            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
              {categoryLabels[recording.category] || recording.category}
            </span>
          </div>
          <div className="flex items-center justify-center h-12">
            <svg className="w-10 h-10 text-teal-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          {recording.durationSeconds && (
            <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
              {formatDuration(recording.durationSeconds)}
            </span>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 text-sm">
            {recording.title}
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            {recording.contributor?.name || "Anonymous"}
          </p>
          <div className="flex flex-wrap gap-1">
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {recording.procedureType}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ContentPreviewSection() {
  const { data: session } = useSession();
  const loggedIn = !!session?.user;
  const [recordings, setRecordings] = useState<FeaturedRecording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch("/api/recordings/featured");
        if (res.ok) {
          const data = await res.json();
          setRecordings(data.recordings || []);
        }
      } catch (err) {
        console.error("Error fetching featured recordings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Real Recovery Stories</h2>
            <p className="text-gray-600">Loading...</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-56 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (recordings.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Real Recovery Stories</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hear from real people about their recovery. All stories are free to watch.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
          {recordings.slice(0, 6).map((rec) => (
            <PreviewCard key={rec.id} recording={rec} />
          ))}
        </div>

        <div className="text-center">
          {loggedIn ? (
            <Link
              href="/watch"
              className="inline-flex items-center justify-center bg-teal-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Browse All Stories
            </Link>
          ) : (
            <>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center bg-teal-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-teal-700 transition-colors mr-4"
              >
                Sign Up Free
              </Link>
              <Link
                href="/watch"
                className="inline-flex items-center justify-center border-2 border-teal-600 text-teal-700 font-semibold px-8 py-3 rounded-lg hover:bg-teal-50 transition-colors"
              >
                Browse All Stories
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
