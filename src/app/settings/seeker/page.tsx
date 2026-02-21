"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import JournalSharingManager from "@/components/seeker/JournalSharingManager";
import { SUBSCRIPTION_MONTHLY_PRICE, SUBSCRIPTION_ANNUAL_PRICE } from "@/lib/constants";

export default function SeekerSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  const role = (session?.user as any)?.role;
  const hasAccess = role === "SEEKER" || role === "BOTH" || role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    if (status === "authenticated" && !hasAccess) router.push("/settings");
  }, [status, hasAccess, router]);

  useEffect(() => {
    if (!session?.user) return;
    async function load() {
      try {
        const res = await fetch("/api/subscription");
        if (res.ok) {
          setSubscription(await res.json());
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

  if (status === "loading" || (status === "authenticated" && !hasAccess)) {
    return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Seeker Settings</h1>
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Seeker Settings</h1>
        <p className="text-gray-600 mt-1">Manage your seeker-specific settings.</p>
      </div>

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
          Control which guides can view your shared journal entries. Only guides you&apos;ve had a completed call with are eligible.
        </p>
        <JournalSharingManager isSubscriber={subscription.status === "active"} />
      </section>

      {/* Become a Guide CTA */}
      {role === "SEEKER" && (
        <section className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-teal-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Been through it?</h2>
              <p className="text-sm text-gray-600 mt-1">
                Sharing your story helps others and can be deeply meaningful for you too. Many guides say it feels almost therapeutic. Become a guide to share your experience, recommend products, and mentor seekers who are just starting out.
              </p>
            </div>
            {upgradeSuccess ? (
              <div className="flex flex-col items-start sm:items-end gap-2">
                <span className="text-sm text-green-700 font-medium">You&apos;re now a guide!</span>
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
                  {upgradingRole ? "Upgrading..." : "Become a Guide"}
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
