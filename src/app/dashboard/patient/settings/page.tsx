"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import PrivacySettingsSection from "@/components/contributor/PrivacySettingsSection";
import JournalSharingManager from "@/components/patient/JournalSharingManager";
import { SUBSCRIPTION_MONTHLY_PRICE, SUBSCRIPTION_ANNUAL_PRICE } from "@/lib/constants";

export default function PatientSettingsPage() {
  const { data: session } = useSession();
  const [privacySettings, setPrivacySettings] = useState({ showRealName: true, displayName: "" });
  const [subscription, setSubscription] = useState<{
    status: string | null;
    plan: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  }>({ status: null, plan: null, currentPeriodEnd: null, cancelAtPeriodEnd: false });
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [upgradingRole, setUpgradingRole] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    async function load() {
      try {
        const [settingsRes, subRes] = await Promise.all([
          fetch("/api/user/settings"),
          fetch("/api/subscription"),
        ]);
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setPrivacySettings({
            showRealName: settings.showRealName ?? true,
            displayName: settings.displayName || "",
          });
        }
        if (subRes.ok) {
          setSubscription(await subRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  async function openSubscriptionPortal() {
    setSubscriptionLoading(true);
    try {
      const res = await fetch("/api/subscription/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubscriptionLoading(false);
    }
  }

  async function handleSubscribe(plan: "monthly" | "annual") {
    setSubscriptionLoading(true);
    try {
      const res = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubscriptionLoading(false);
    }
  }

  if (loading) {
    return <div className="text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-0">
      {/* Privacy Settings */}
      <PrivacySettingsSection
        userName={session?.user?.name}
        initialSettings={privacySettings}
      />

      {/* Subscription Management */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Subscription</h2>

        {subscription.status === "active" && !subscription.cancelAtPeriodEnd && (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-800">Active Subscriber</p>
              <p className="text-sm text-gray-600">
                {subscription.plan === "annual" ? "Annual" : "Monthly"} plan
                {subscription.currentPeriodEnd && (
                  <> &middot; Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
                )}
              </p>
            </div>
            <button
              onClick={openSubscriptionPortal}
              disabled={subscriptionLoading}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50"
            >
              {subscriptionLoading ? "Loading..." : "Manage Subscription"}
            </button>
          </div>
        )}

        {subscription.status === "active" && subscription.cancelAtPeriodEnd && (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-yellow-800">Subscription Ending</p>
              <p className="text-sm text-gray-600">
                Ends on {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "soon"}
              </p>
            </div>
            <button
              onClick={openSubscriptionPortal}
              disabled={subscriptionLoading}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm font-medium disabled:opacity-50"
            >
              {subscriptionLoading ? "Loading..." : "Resubscribe"}
            </button>
          </div>
        )}

        {subscription.status === "past_due" && (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-red-800">Payment Failed</p>
              <p className="text-sm text-gray-600">Please update your payment method.</p>
            </div>
            <button
              onClick={openSubscriptionPortal}
              disabled={subscriptionLoading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
            >
              {subscriptionLoading ? "Loading..." : "Update Payment"}
            </button>
          </div>
        )}

        {(!subscription.status || subscription.status === "canceled") && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Subscribe to unlock all recovery stories — ${SUBSCRIPTION_MONTHLY_PRICE}/mo or ${SUBSCRIPTION_ANNUAL_PRICE}/yr
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSubscribe("monthly")}
                disabled={subscriptionLoading}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50"
              >
                {subscriptionLoading ? "Loading..." : "Subscribe Monthly"}
              </button>
              <button
                onClick={() => handleSubscribe("annual")}
                disabled={subscriptionLoading}
                className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800 text-sm font-medium disabled:opacity-50"
              >
                {subscriptionLoading ? "Loading..." : "Subscribe Annual"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Journal Sharing */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold mb-2">Journal Sharing</h2>
        <p className="text-sm text-gray-600 mb-4">
          Control which contributors can view your shared journal entries. Only contributors you&apos;ve had a completed call with are eligible.
        </p>
        <JournalSharingManager isSubscriber={subscription.status === "active"} />
      </section>

      {/* Become a Contributor CTA */}
      {(session?.user as any)?.role === "PATIENT" && (
        <section className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-teal-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Been through it?</h2>
              <p className="text-sm text-gray-600 mt-1">
                Sharing your story helps others and can be deeply meaningful for you too. Many contributors say it feels almost therapeutic. Become a contributor to share your experience, recommend products, and mentor patients who are just starting out.
              </p>
            </div>
            {upgradeSuccess ? (
              <div className="flex flex-col items-start sm:items-end gap-2">
                <span className="text-sm text-green-700 font-medium">You&apos;re now a contributor!</span>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium"
                >
                  Refresh to get started
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-start sm:items-end gap-2">
                {upgradeError && <span className="text-sm text-red-600">{upgradeError}</span>}
                <button
                  onClick={async () => {
                    setUpgradingRole(true);
                    setUpgradeError(null);
                    try {
                      const res = await fetch("/api/user/upgrade-role", { method: "POST" });
                      if (res.ok) {
                        setUpgradeSuccess(true);
                      } else {
                        const data = await res.json();
                        setUpgradeError(data.error || "Failed to upgrade role");
                      }
                    } catch {
                      setUpgradeError("Failed to upgrade role");
                    } finally {
                      setUpgradingRole(false);
                    }
                  }}
                  disabled={upgradingRole}
                  className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 whitespace-nowrap"
                >
                  {upgradingRole ? "Upgrading..." : "Become a Contributor"}
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
