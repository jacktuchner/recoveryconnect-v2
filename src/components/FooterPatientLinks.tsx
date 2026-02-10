"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function FooterPatientLinks() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isContributorOnly = role === "CONTRIBUTOR";

  // Contributor-only users don't need patient links
  if (isContributorOnly) return null;

  const isPatient = role === "PATIENT" || role === "BOTH" || role === "ADMIN";

  return (
    <div>
      <h4 className="text-white font-semibold mb-3">For Patients</h4>
      <ul className="space-y-2 text-sm">
        <li><Link href="/watch" className="hover:text-white">Watch Stories</Link></li>
        <li><Link href="/mentors" className="hover:text-white">Book a Mentor</Link></li>
        <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
        {isPatient ? (
          <li><Link href="/dashboard/patient" className="hover:text-white">Patient Dashboard</Link></li>
        ) : !session ? (
          <li><Link href="/auth/register" className="hover:text-white">Create Account</Link></li>
        ) : null}
      </ul>
    </div>
  );
}
