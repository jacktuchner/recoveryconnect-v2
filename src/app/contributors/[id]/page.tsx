"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import RecordingCard from "@/components/RecordingCard";
import { getTimeSinceSurgeryLabel } from "@/lib/surgeryDate";


const activityLabels: Record<string, string> = {
  SEDENTARY: "Sedentary",
  RECREATIONAL: "Recreational",
  COMPETITIVE_ATHLETE: "Competitive Athlete",
  PROFESSIONAL_ATHLETE: "Professional Athlete",
};


export default function ContributorDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [contributor, setContributor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check if viewing own profile
  const isOwnProfile = session?.user && (session.user as any).id === id;


  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/contributors/${id}`);
        if (res.ok) setContributor(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);


  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;
  if (!contributor) return <div className="max-w-4xl mx-auto px-4 py-8">Contributor not found.</div>;


  const avgRating = contributor.reviewsReceived?.length
    ? (contributor.reviewsReceived.reduce((a: number, r: any) => a + r.rating, 0) / contributor.reviewsReceived.length).toFixed(1)
    : null;


  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/browse?tab=contributors" className="text-sm text-teal-600 hover:text-teal-700 mb-4 inline-block">
        &larr; Back to Contributors
      </Link>

      {/* Intro Video */}
      {contributor.profile?.introVideoUrl && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <video
            src={contributor.profile.introVideoUrl}
            controls
            autoPlay
            muted
            playsInline
            className="w-full max-h-96 bg-black"
          />
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Meet {contributor.name?.split(" ")[0] || "this contributor"}
              {contributor.profile.introVideoDuration && (
                <span className="text-gray-400 ml-2">
                  ({Math.floor(contributor.profile.introVideoDuration / 60)}:{(contributor.profile.introVideoDuration % 60).toString().padStart(2, "0")})
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-teal-700 font-bold text-2xl">
              {contributor.name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{contributor.name}</h1>
            <p className="text-gray-600">{contributor.profile?.procedureType}</p>
            {avgRating && (
              <p className="text-sm text-gray-500 mt-1">
                {avgRating} avg rating &middot; {contributor.reviewsReceived.length} reviews
              </p>
            )}
          </div>
          {contributor.profile?.isAvailableForCalls && !isOwnProfile && (
            <Link
              href={`/book/${contributor.id}`}
              className="bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 font-medium text-sm flex-shrink-0"
            >
              Book a Call &middot; ${(contributor.profile.hourlyRate / 2).toFixed(0)}/30min
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            {contributor.profile?.ageRange}
          </span>
          <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            {activityLabels[contributor.profile?.activityLevel] || contributor.profile?.activityLevel}
          </span>
          {(contributor.profile?.surgeryDate || contributor.profile?.timeSinceSurgery) && (
            <span className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
              {contributor.profile.surgeryDate
                ? getTimeSinceSurgeryLabel(contributor.profile.surgeryDate)
                : `${contributor.profile.timeSinceSurgery} post-op`}
            </span>
          )}
          {contributor.profile?.isAvailableForCalls && (
            <span className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded-full">
              Available for calls
            </span>
          )}
        </div>

        {contributor.profile?.recoveryGoals?.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Recovery Goals:</p>
            <div className="flex flex-wrap gap-1.5">
              {contributor.profile.recoveryGoals.map((g: string) => (
                <span key={g} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{g}</span>
              ))}
            </div>
          </div>
        )}

        {contributor.bio && <p className="text-gray-600">{contributor.bio}</p>}
      </div>

      {/* Recordings */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Recordings ({contributor.recordings?.length || 0})</h2>
        {contributor.recordings?.length === 0 ? (
          <p className="text-gray-400">No recordings yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contributor.recordings.map((rec: any) => (
              <RecordingCard
                key={rec.id}
                id={rec.id}
                title={rec.title}
                contributorName={contributor.name || "Anonymous"}
                procedureType={rec.procedureType}
                ageRange={rec.ageRange}
                activityLevel={rec.activityLevel}
                category={rec.category}
                durationSeconds={rec.durationSeconds}
                isVideo={rec.isVideo}
                price={rec.price}
                viewCount={rec.viewCount}
                averageRating={
                  rec.reviews?.length
                    ? rec.reviews.reduce((a: number, r: any) => a + r.rating, 0) / rec.reviews.length
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section>
        <h2 className="text-xl font-bold mb-4">Reviews ({contributor.reviewsReceived?.length || 0})</h2>
        {contributor.reviewsReceived?.length === 0 ? (
          <p className="text-gray-400">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {contributor.reviewsReceived.map((r: any) => (
              <div key={r.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{r.author?.name || "Anonymous"}</span>
                  <span className="text-yellow-500 text-sm">
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}