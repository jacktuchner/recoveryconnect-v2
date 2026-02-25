"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function GuideCTA({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const btnClass = variant === "light"
    ? "inline-flex items-center justify-center bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
    : "inline-flex items-center justify-center bg-white text-teal-700 font-semibold px-6 py-3 rounded-lg hover:bg-teal-50 transition-colors disabled:opacity-50";
  const { data: session } = useSession();

  const role = (session?.user as any)?.role;
  const guideStatus = (session?.user as any)?.guideStatus;
  const isAlreadyGuide = role === "GUIDE" || role === "BOTH" || role === "ADMIN";

  // Approved guide — link to dashboard
  if (isAlreadyGuide && guideStatus === "APPROVED") {
    return (
      <Link href="/dashboard/guide" className={btnClass}>
        Go to Guide Dashboard
      </Link>
    );
  }

  // Admin — always has access
  if (role === "ADMIN") {
    return (
      <Link href="/dashboard/guide" className={btnClass}>
        Go to Guide Dashboard
      </Link>
    );
  }

  // Pending review — show status message
  if (guideStatus === "PENDING_REVIEW") {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className={variant === "light" ? "text-amber-700 font-medium text-sm" : "text-amber-200 font-medium text-sm"}>
          Application under review
        </p>
        <Link href="/guide-application" className={btnClass}>
          View Application Status
        </Link>
      </div>
    );
  }

  // Rejected — show rejection notice with reapply
  if (guideStatus === "REJECTED") {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className={variant === "light" ? "text-red-600 text-sm" : "text-red-200 text-sm"}>
          Application not approved
        </p>
        <Link href="/guide-application" className={btnClass}>
          Reapply as Guide
        </Link>
      </div>
    );
  }

  // Seeker — link to application form
  if (role === "SEEKER") {
    return (
      <Link href="/guide-application" className={btnClass}>
        Become a Guide
      </Link>
    );
  }

  // Not logged in — register link
  return (
    <Link href="/auth/register?role=guide" className={btnClass}>
      Become a Guide
    </Link>
  );
}
