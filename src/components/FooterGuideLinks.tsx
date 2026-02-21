"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function FooterGuideLinks() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role;
  const isContributor = role === "GUIDE" || role === "BOTH" || role === "ADMIN";
  const isPatient = role === "SEEKER";

  async function handleUpgrade() {
    if (!confirm("Would you like to become a guide? You'll be able to share your recovery experience and help other seekers.")) return;
    try {
      const res = await fetch("/api/user/upgrade-role", { method: "POST" });
      if (res.ok) {
        router.push("/dashboard/guide");
        router.refresh();
      }
    } catch {}
  }

  return (
    <ul className="space-y-2 text-sm">
      {isContributor ? (
        <li><Link href="/dashboard/guide" className="hover:text-white">Guide Dashboard</Link></li>
      ) : isPatient ? (
        <li><button onClick={handleUpgrade} className="hover:text-white">Become a Guide</button></li>
      ) : (
        <li><Link href="/auth/register?role=guide" className="hover:text-white">Become a Guide</Link></li>
      )}
      <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
    </ul>
  );
}
