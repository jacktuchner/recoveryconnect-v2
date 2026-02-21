"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface MessageButtonProps {
  contributorId: string;
}

export default function MessageButton({ contributorId }: MessageButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const user = session?.user as any;
  const isSubscriber =
    user?.subscriptionStatus === "active" ||
    user?.subscriptionStatus === "trialing";
  const isPatient = user?.role === "SEEKER";
  const needsSubscription = isPatient && !isSubscriber;

  async function handleClick() {
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    if (needsSubscription) {
      router.push("/dashboard/seeker?tab=subscription");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: contributorId }),
      });

      if (res.ok) {
        const { conversationId } = await res.json();
        router.push(`/messages/${conversationId}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to start conversation");
      }
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-white text-teal-700 border border-teal-300 px-5 py-2.5 rounded-lg hover:bg-teal-50 font-medium text-sm disabled:opacity-50 transition-colors flex-shrink-0"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {loading ? "..." : needsSubscription ? "Subscribe to Message" : "Message"}
    </button>
  );
}
