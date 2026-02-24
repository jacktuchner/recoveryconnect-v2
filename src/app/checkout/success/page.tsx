"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const type = searchParams.get("type");
  const [purchaseInfo, setPurchaseInfo] = useState<{
    type: string;
    recordingId?: string;
    recordingTitle?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<"verifying" | "confirmed" | "error">("verifying");

  const isGroupSession = type === "group_session";
  const isCall = type === "call";
  const groupSessionId = searchParams.get("groupSessionId");

  function loadPurchaseInfo() {
    if (!sessionId || isGroupSession || isCall) return;
    setError(null);
    fetch(`/api/checkout/session?session_id=${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load purchase details.");
        return res.json();
      })
      .then((data) => setPurchaseInfo(data))
      .catch(() => setError("Failed to load purchase details."));
  }

  useEffect(() => {
    loadPurchaseInfo();
  }, [sessionId]);

  // Verify call checkout and create the call record if webhook hasn't
  useEffect(() => {
    if (!isCall || !sessionId) return;
    fetch("/api/checkout/call/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "created" || data.status === "already_created") {
          setCallStatus("confirmed");
        } else {
          setCallStatus("error");
        }
      })
      .catch(() => setCallStatus("error"));
  }, [isCall, sessionId]);

  if (isCall) {
    return (
      <div className="flex flex-col items-center gap-4">
        {callStatus === "verifying" && (
          <p className="text-gray-500 text-sm">Confirming your call booking...</p>
        )}
        {callStatus === "error" && (
          <p className="text-red-600 text-sm">There was an issue confirming your call. Please check your dashboard or contact support.</p>
        )}
        {callStatus === "confirmed" && (
          <p className="text-green-600 text-sm font-medium">Your call has been booked! The guide will be notified.</p>
        )}
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard/seeker"
            className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
          >
            View Your Calls
          </Link>
          <Link
            href="/guides"
            className="text-teal-600 hover:text-teal-700 px-5 py-2 text-sm font-medium"
          >
            Browse More Guides
          </Link>
        </div>
      </div>
    );
  }

  if (isGroupSession) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4 justify-center">
          {groupSessionId ? (
            <Link
              href={`/group-sessions/${groupSessionId}`}
              className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
            >
              View Session Details
            </Link>
          ) : (
            <Link
              href="/group-sessions"
              className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
            >
              Browse Group Sessions
            </Link>
          )}
          <Link
            href="/dashboard/seeker"
            className="text-teal-600 hover:text-teal-700 px-5 py-2 text-sm font-medium"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-2 flex items-center justify-between w-full max-w-md">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={loadPurchaseInfo} className="text-sm text-red-600 hover:text-red-700 font-medium">Retry</button>
        </div>
      )}
      <div className="flex gap-4 justify-center">
      {purchaseInfo?.recordingId ? (
        <Link
          href={`/recordings/${purchaseInfo.recordingId}`}
          className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
        >
          Watch Recording
        </Link>
      ) : (
        <Link
          href="/dashboard/seeker"
          className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
        >
          Go to Dashboard
        </Link>
      )}
      <Link
        href="/browse"
        className="text-teal-600 hover:text-teal-700 px-5 py-2 text-sm font-medium"
      >
        Continue Browsing
      </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-16 text-center">Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const isGroupSession = type === "group_session";
  const isCall = type === "call";

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold mb-2">
        {isGroupSession ? "You're Signed Up!" : isCall ? "Call Booked!" : "Payment Successful!"}
      </h1>
      <p className="text-gray-600 mb-6">
        {isGroupSession
          ? "You're registered for the group session. We'll send you a reminder before it starts."
          : isCall
          ? "Your call has been scheduled. You can view it on your dashboard."
          : "Thank you! You can view your details on the dashboard."}
      </p>

      <SuccessContent />
    </div>
  );
}
