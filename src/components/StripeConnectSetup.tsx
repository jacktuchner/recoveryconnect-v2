"use client";

import { useState, useEffect } from "react";

interface ConnectStatus {
  connected: boolean;
  onboarded: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

export default function StripeConnectSetup() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/stripe/connect");
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (err) {
      console.error("Error fetching Connect status:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetupPayouts() {
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create Connect account");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error setting up payouts:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleViewDashboard() {
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/connect/dashboard");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to get dashboard link");
        return;
      }

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Error getting dashboard link:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Payout Settings</h2>
        {status?.onboarded && (
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
            Active
          </span>
        )}
      </div>

      {!status?.connected ? (
        <div>
          <p className="text-gray-600 mb-4">
            Set up your payout account to receive earnings from your calls and group sessions.
            We use Stripe for secure payments.
          </p>
          <button
            onClick={handleSetupPayouts}
            disabled={actionLoading}
            className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
          >
            {actionLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Setting up...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Set Up Payouts
              </>
            )}
          </button>
        </div>
      ) : !status.onboarded ? (
        <div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-yellow-800">Setup incomplete</p>
                <p className="text-sm text-yellow-700">
                  Please complete your Stripe account setup to start receiving payouts.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSetupPayouts}
            disabled={actionLoading}
            className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
          >
            {actionLoading ? "Loading..." : "Complete Setup"}
          </button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Charges</p>
              <p className="font-medium text-green-600">
                {status.chargesEnabled ? "Enabled" : "Pending"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Payouts</p>
              <p className="font-medium text-green-600">
                {status.payoutsEnabled ? "Enabled" : "Pending"}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Your payout account is active. Earnings will be automatically transferred to your bank account.
          </p>
          <button
            onClick={handleViewDashboard}
            disabled={actionLoading}
            className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1"
          >
            {actionLoading ? "Loading..." : (
              <>
                View Stripe Dashboard
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-3">{error}</p>
      )}
    </div>
  );
}
