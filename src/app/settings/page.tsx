"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import PrivacySettingsSection from "@/components/guide/PrivacySettingsSection";
import JournalSharingManager from "@/components/seeker/JournalSharingManager";
import StripeConnectSetup from "@/components/StripeConnectSetup";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [privacySettings, setPrivacySettings] = useState({ showRealName: true, displayName: "" });
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [upgradingRole, setUpgradingRole] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const role = (session?.user as any)?.role;
  const isSeeker = role === "SEEKER" || role === "BOTH" || role === "ADMIN";
  const isGuide = role === "GUIDE" || role === "BOTH" || role === "ADMIN";
  const showSeekerCTA = role === "SEEKER";
  const showGuideCTA = role === "GUIDE";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user) return;
    async function load() {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const settings = await res.json();
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

  if (status === "loading" || status === "unauthenticated") {
    return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences.</p>
      </div>

      {/* ── General Settings ── */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">General</h2>

        <PrivacySettingsSection
          userName={session?.user?.name}
          initialSettings={privacySettings}
        />

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Change Password</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setPasswordMessage(null);
              if (newPassword !== confirmPassword) {
                setPasswordMessage({ type: "error", text: "New passwords do not match" });
                return;
              }
              if (newPassword.length < 8) {
                setPasswordMessage({ type: "error", text: "New password must be at least 8 characters" });
                return;
              }
              setPasswordChanging(true);
              try {
                const res = await fetch("/api/user/change-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ currentPassword, newPassword }),
                });
                const data = await res.json();
                if (res.ok) {
                  setPasswordMessage({ type: "success", text: data.message });
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                } else {
                  setPasswordMessage({ type: "error", text: data.error || "Failed to change password" });
                }
              } catch {
                setPasswordMessage({ type: "error", text: "Failed to change password" });
              } finally {
                setPasswordChanging(false);
              }
            }}
            className="space-y-4 max-w-md"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {passwordMessage && (
              <p className={`text-sm ${passwordMessage.type === "success" ? "text-green-700" : "text-red-600"}`}>
                {passwordMessage.text}
              </p>
            )}
            <button
              type="submit"
              disabled={passwordChanging}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50"
            >
              {passwordChanging ? "Changing..." : "Change Password"}
            </button>
          </form>
        </section>
      </div>

      {/* ── Seeker Settings ── */}
      {isSeeker && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Seeker Settings</h2>

          <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold mb-2">Journal Sharing</h2>
            <p className="text-sm text-gray-600 mb-4">
              Control which guides can view your shared journal entries. Only guides you&apos;ve had a completed call with are eligible.
            </p>
            <JournalSharingManager />
          </section>

          {showSeekerCTA && (
            <section className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-teal-200 p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Been through it?</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Sharing your story helps others and can be deeply meaningful for you too. Many guides say it feels almost therapeutic. Become a guide to share your experience, recommend products, and mentor seekers who are just starting out.
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  {upgradeError && <span className="text-sm text-red-600">{upgradeError}</span>}
                  <button
                    onClick={async () => {
                      setUpgradingRole(true);
                      setUpgradeError(null);
                      try {
                        const res = await fetch("/api/user/upgrade-role", { method: "POST" });
                        const data = await res.json();
                        if (res.ok && data.redirect) {
                          router.push(data.redirect);
                        } else if (!res.ok) {
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
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Guide Settings ── */}
      {isGuide && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Guide Settings</h2>

          <section className="mb-8">
            <StripeConnectSetup />
          </section>

          {showGuideCTA && (
            <section className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-teal-200 p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Also recovering from something?</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Add a health profile to connect with guides who&apos;ve been through it.
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  {upgradeError && <span className="text-sm text-red-600">{upgradeError}</span>}
                  <button
                    onClick={async () => {
                      setUpgradingRole(true);
                      setUpgradeError(null);
                      try {
                        const res = await fetch("/api/user/upgrade-role", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ targetRole: "BOTH" }),
                        });
                        const data = await res.json();
                        if (res.ok && data.redirect) {
                          router.push(data.redirect);
                        } else if (!res.ok) {
                          setUpgradeError(data.error || "Failed to add health profile");
                        }
                      } catch {
                        setUpgradeError("Failed to add health profile");
                      } finally {
                        setUpgradingRole(false);
                      }
                    }}
                    disabled={upgradingRole}
                    className="text-sm bg-white text-teal-700 border border-teal-300 px-4 py-2 rounded-lg hover:bg-teal-50 font-medium disabled:opacity-50 whitespace-nowrap"
                  >
                    {upgradingRole ? "Upgrading..." : "Add Health Profile"}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
