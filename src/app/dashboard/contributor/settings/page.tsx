"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import StripeConnectSetup from "@/components/StripeConnectSetup";
import AvailabilityManager from "@/components/AvailabilityManager";
import PrivacySettingsSection from "@/components/contributor/PrivacySettingsSection";

export default function ContributorSettingsPage() {
  const { data: session } = useSession();
  const [isAvailableForCalls, setIsAvailableForCalls] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({ showRealName: true, displayName: "" });
  const [loading, setLoading] = useState(true);
  const [upgradingRole, setUpgradingRole] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    async function load() {
      try {
        const [profileRes, settingsRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/user/settings"),
        ]);
        if (profileRes.ok) {
          const p = await profileRes.json();
          if (p) {
            setIsAvailableForCalls(p.isAvailableForCalls || false);
          }
        }
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setPrivacySettings({
            showRealName: settings.showRealName ?? true,
            displayName: settings.displayName || "",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {isAvailableForCalls && (
        <section className="mb-8">
          <AvailabilityManager />
        </section>
      )}

      <section className="mb-8">
        <StripeConnectSetup />
      </section>

      <PrivacySettingsSection
        userName={session?.user?.name}
        initialSettings={privacySettings}
      />

      {/* Upgrade to Patient Access */}
      {(session?.user as any)?.role === "CONTRIBUTOR" && (
        <section className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-teal-200 p-6 mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Need guidance for a new surgery?</h2>
              <p className="text-sm text-gray-600 mt-1">Get access to patient features like watching recovery stories and booking mentors.</p>
            </div>
            {upgradeSuccess ? (
              <div className="flex flex-col items-start sm:items-end gap-2">
                <span className="text-sm text-green-700 font-medium">Role upgraded successfully!</span>
                <button onClick={() => signOut()} className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium">Sign out to apply changes</button>
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
                  className="text-sm bg-white text-teal-700 border border-teal-300 px-4 py-2 rounded-lg hover:bg-teal-50 font-medium disabled:opacity-50"
                >
                  {upgradingRole ? "Upgrading..." : "Get Patient Access"}
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
