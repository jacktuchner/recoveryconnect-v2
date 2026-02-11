"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ContributorCTA({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const btnClass = variant === "light"
    ? "inline-flex items-center justify-center bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
    : "inline-flex items-center justify-center bg-white text-teal-700 font-semibold px-6 py-3 rounded-lg hover:bg-teal-50 transition-colors disabled:opacity-50";
  const { data: session } = useSession();

  const role = (session?.user as any)?.role;
  const contributorStatus = (session?.user as any)?.contributorStatus;
  const isAlreadyContributor = role === "CONTRIBUTOR" || role === "BOTH" || role === "ADMIN";

  // Approved contributor — link to dashboard
  if (isAlreadyContributor && contributorStatus === "APPROVED") {
    return (
      <Link href="/dashboard/contributor" className={btnClass}>
        Go to Contributor Dashboard
      </Link>
    );
  }

  // Admin — always has access
  if (role === "ADMIN") {
    return (
      <Link href="/dashboard/contributor" className={btnClass}>
        Go to Contributor Dashboard
      </Link>
    );
  }

  // Pending review — show status message
  if (contributorStatus === "PENDING_REVIEW") {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className={variant === "light" ? "text-amber-700 font-medium text-sm" : "text-amber-200 font-medium text-sm"}>
          Application under review
        </p>
        <Link href="/contributor-application" className={btnClass}>
          View Application Status
        </Link>
      </div>
    );
  }

  // Rejected — show rejection notice with reapply
  if (contributorStatus === "REJECTED") {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className={variant === "light" ? "text-red-600 text-sm" : "text-red-200 text-sm"}>
          Application not approved
        </p>
        <Link href="/contributor-application" className={btnClass}>
          Reapply as Contributor
        </Link>
      </div>
    );
  }

  // Patient — link to application form
  if (role === "PATIENT") {
    return (
      <Link href="/contributor-application" className={btnClass}>
        Become a Contributor
      </Link>
    );
  }

  // Not logged in — register link
  return (
    <Link href="/auth/register?role=contributor" className={btnClass}>
      Become a Contributor
    </Link>
  );
}
