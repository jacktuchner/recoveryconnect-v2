"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ContributorCTA() {
  const { data: session } = useSession();
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = (session?.user as any)?.role;
  const isPatientOnly = role === "PATIENT";
  const isAlreadyContributor = role === "CONTRIBUTOR" || role === "BOTH" || role === "ADMIN";

  async function handleUpgrade() {
    if (!confirm("Would you like to become a contributor? You'll be able to share your recovery experience and help other patients.")) return;
    setUpgrading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/upgrade-role", { method: "POST" });
      if (res.ok) {
        setUpgraded(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to upgrade role");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setUpgrading(false);
    }
  }

  // Already a contributor — link to their dashboard
  if (isAlreadyContributor) {
    return (
      <Link
        href="/dashboard/contributor"
        className="inline-flex items-center justify-center bg-white text-teal-700 font-semibold px-6 py-3 rounded-lg hover:bg-teal-50 transition-colors"
      >
        Go to Contributor Dashboard
      </Link>
    );
  }

  // Just upgraded
  if (upgraded) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-teal-100 font-medium">You&apos;re now a contributor!</p>
        <button
          onClick={() => { router.push("/dashboard/contributor"); router.refresh(); }}
          className="inline-flex items-center justify-center bg-white text-teal-700 font-semibold px-6 py-3 rounded-lg hover:bg-teal-50 transition-colors"
        >
          Go to Contributor Dashboard
        </button>
      </div>
    );
  }

  // Logged in as patient — upgrade button
  if (isPatientOnly) {
    return (
      <div className="flex flex-col items-center gap-2">
        {error && <p className="text-red-200 text-sm">{error}</p>}
        <button
          onClick={handleUpgrade}
          disabled={upgrading}
          className="inline-flex items-center justify-center bg-white text-teal-700 font-semibold px-6 py-3 rounded-lg hover:bg-teal-50 transition-colors disabled:opacity-50"
        >
          {upgrading ? "Setting up..." : "Become a Contributor"}
        </button>
      </div>
    );
  }

  // Not logged in — register link
  return (
    <Link
      href="/auth/register?role=contributor"
      className="inline-flex items-center justify-center bg-white text-teal-700 font-semibold px-6 py-3 rounded-lg hover:bg-teal-50 transition-colors"
    >
      Become a Contributor
    </Link>
  );
}
