"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function BrowseRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tab = searchParams.get("tab");
    const procedure = searchParams.get("procedure");
    const ageRange = searchParams.get("ageRange");
    const activityLevel = searchParams.get("activityLevel");
    const category = searchParams.get("category");

    // Build query params to preserve
    const params = new URLSearchParams();
    if (procedure) params.set("procedure", procedure);
    if (ageRange) params.set("ageRange", ageRange);
    if (activityLevel) params.set("activityLevel", activityLevel);
    if (category) params.set("category", category);

    const queryString = params.toString();

    if (tab === "contributors" || tab === "guides") {
      router.replace(`/guides${queryString ? `?${queryString}` : ""}`);
    } else {
      router.replace(`/watch${queryString ? `?${queryString}` : ""}`);
    }
  }, [searchParams, router]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <div className="animate-pulse">
        <p className="text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8">Loading...</div>}>
      <BrowseRedirect />
    </Suspense>
  );
}
