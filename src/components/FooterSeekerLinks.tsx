"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function FooterSeekerLinks() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isGuideOnly = role === "GUIDE";

  // Guide-only users don't need seeker links
  if (isGuideOnly) return null;

  const isSeeker = role === "SEEKER" || role === "BOTH" || role === "ADMIN";

  return (
    <div>
      <h4 className="text-white font-semibold mb-3">For Seekers</h4>
      <ul className="space-y-2 text-sm">
        <li><Link href="/watch" className="hover:text-white">Watch Stories</Link></li>
        <li><Link href="/guides" className="hover:text-white">Book a Guide</Link></li>
        <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
        {isSeeker ? (
          <li><Link href="/dashboard/seeker" className="hover:text-white">Seeker Dashboard</Link></li>
        ) : !session ? (
          <li><Link href="/auth/register" className="hover:text-white">Create Account</Link></li>
        ) : null}
      </ul>
    </div>
  );
}
