"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import JournalSharingManager from "@/components/seeker/JournalSharingManager";

export default function SeekerSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [upgradingRole, setUpgradingRole] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const role = (session?.user as any)?.role;
  const hasAccess = role === "SEEKER" || role === "BOTH" || role === "ADMIN";

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
        <h1 className="text-3xl font-bold">Seeker Settings</h1>
        <p className="text-gray-600 mt-1">Manage your seeker-specific settings.</p>
      </div>

      {/* Journal Sharing */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold mb-2">Journal Sharing</h2>
        <p className="text-sm text-gray-600 mb-4">
          Control which guides can view your shared journal entries. Only guides you&apos;ve had a completed call with are eligible.
        </p>
        <JournalSharingManager />
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
