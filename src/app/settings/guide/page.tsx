"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import StripeConnectSetup from "@/components/StripeConnectSetup";

export default function GuideSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [upgradingRole, setUpgradingRole] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const role = (session?.user as any)?.role;
  const hasAccess = role === "GUIDE" || role === "BOTH" || role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    if (status === "authenticated" && !hasAccess) router.push("/settings");
  }, [status, hasAccess, router]);

  if (status === "loading" || (status === "authenticated" && !hasAccess)) {
    return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Guide Settings</h1>
        <p className="text-gray-600 mt-1">Manage your guide-specific settings.</p>
      </div>

      <section className="mb-8">
        <StripeConnectSetup />
      </section>

      {/* Upgrade to Seeker Access */}
      {role === "GUIDE" && (
        <section className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-teal-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Need guidance for a new surgery?</h2>
              <p className="text-sm text-gray-600 mt-1">Get access to seeker features like watching recovery stories and booking mentors.</p>
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
                  {upgradingRole ? "Upgrading..." : "Get Seeker Access"}
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
