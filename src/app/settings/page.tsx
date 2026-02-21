"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import PrivacySettingsSection from "@/components/guide/PrivacySettingsSection";

export default function GeneralSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [privacySettings, setPrivacySettings] = useState({ showRealName: true, displayName: "" });
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
        <h1 className="text-3xl font-bold mb-6">General Settings</h1>
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">General Settings</h1>
        <p className="text-gray-600 mt-1">Settings that apply to your account regardless of role.</p>
      </div>

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
  );
}
