"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GuideSettingsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/settings"); }, [router]);
  return <div className="max-w-4xl mx-auto px-4 py-8">Redirecting...</div>;
}
