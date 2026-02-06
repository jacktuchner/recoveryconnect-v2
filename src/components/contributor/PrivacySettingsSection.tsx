"use client";

import { useState } from "react";

interface PrivacySettingsSectionProps {
  userName: string | null | undefined;
  initialSettings: { showRealName: boolean; displayName: string };
}

export default function PrivacySettingsSection({ userName, initialSettings }: PrivacySettingsSectionProps) {
  const [privacySettings, setPrivacySettings] = useState(initialSettings);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);

  async function savePrivacySettings() {
    setSavingPrivacy(true);
    setPrivacySaved(false);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(privacySettings),
      });
      if (res.ok) {
        setPrivacySaved(true);
        setTimeout(() => setPrivacySaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPrivacy(false);
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Privacy Settings</h2>
      <p className="text-sm text-gray-600 mb-4">Control how your name appears on the platform. Your real name is always visible to admins for payment purposes.</p>

      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={privacySettings.showRealName} onChange={(e) => setPrivacySettings((prev) => ({ ...prev, showRealName: e.target.checked }))} className="mt-1 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          <div>
            <span className="font-medium text-gray-900">Show my real name publicly</span>
            <p className="text-sm text-gray-500">When enabled, your real name ({userName}) will be visible to other users.</p>
          </div>
        </label>

        {!privacySettings.showRealName && (
          <div className="ml-7">
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input type="text" value={privacySettings.displayName} onChange={(e) => setPrivacySettings((prev) => ({ ...prev, displayName: e.target.value }))} placeholder="e.g., RecoveryMentor22" className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm" maxLength={50} />
            <p className="text-xs text-gray-500 mt-1">This name will be shown instead of your real name. Leave blank to show as &quot;{userName?.[0]}. (Anonymous)&quot;.</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button onClick={savePrivacySettings} disabled={savingPrivacy} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium">{savingPrivacy ? "Saving..." : "Save Privacy Settings"}</button>
          {privacySaved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
        </div>
      </div>
    </section>
  );
}
