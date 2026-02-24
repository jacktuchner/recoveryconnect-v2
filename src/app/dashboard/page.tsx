"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/auth/signin");
      return;
    }

    const role = (session?.user as any)?.role;

    if (role === "GUIDE") {
      router.replace("/dashboard/guide");
    } else {
      // SEEKER, BOTH, ADMIN all go to seeker dashboard
      router.replace("/dashboard/seeker");
    }
  }, [status, session, router]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}
