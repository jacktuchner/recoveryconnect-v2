"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function HeroCTA() {
  const { data: session } = useSession();

  if (session) {
    const role = (session.user as any)?.role;
    const dashboardHref =
      role === "GUIDE"
        ? "/dashboard/guide"
        : role === "ADMIN"
          ? "/admin"
          : "/dashboard/seeker";

    return (
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href={dashboardHref}
          className="inline-flex items-center justify-center bg-white text-teal-700 font-semibold px-6 py-3 rounded-lg hover:bg-teal-50 transition-colors"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/watch"
          className="inline-flex items-center justify-center border-2 border-teal-300 text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors"
        >
          Watch Stories
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Link
        href="/auth/register"
        className="inline-flex items-center justify-center bg-white text-teal-700 font-semibold px-6 py-3 rounded-lg hover:bg-teal-50 transition-colors"
      >
        Get Started Free
      </Link>
      <Link
        href="/watch"
        className="inline-flex items-center justify-center border-2 border-teal-300 text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors"
      >
        Watch Stories
      </Link>
    </div>
  );
}
