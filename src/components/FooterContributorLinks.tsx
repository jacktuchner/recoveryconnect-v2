"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function FooterContributorLinks() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role;
  const isContributor = role === "CONTRIBUTOR" || role === "BOTH" || role === "ADMIN";
  const isPatient = role === "PATIENT";

  async function handleUpgrade() {
    if (!confirm("Would you like to become a contributor? You'll be able to share your recovery experience and help other patients.")) return;
    try {
      const res = await fetch("/api/user/upgrade-role", { method: "POST" });
      if (res.ok) {
        router.push("/dashboard/contributor");
        router.refresh();
      }
    } catch {}
  }

  return (
    <ul className="space-y-2 text-sm">
      {isContributor ? (
        <li><Link href="/dashboard/contributor" className="hover:text-white">Contributor Dashboard</Link></li>
      ) : isPatient ? (
        <li><button onClick={handleUpgrade} className="hover:text-white">Become a Contributor</button></li>
      ) : (
        <li><Link href="/auth/register?role=contributor" className="hover:text-white">Become a Contributor</Link></li>
      )}
      <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
    </ul>
  );
}
