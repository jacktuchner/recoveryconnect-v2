"use client";

import { useState, useEffect } from "react";

const GUIDELINES_KEY = "kizu-guide-guidelines-accepted";

interface GuideGuidelinesProps {
  children: React.ReactNode;
  onAccept?: () => void;
}

export default function GuideGuidelines({ children, onAccept }: GuideGuidelinesProps) {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [checkboxes, setCheckboxes] = useState({
    personalExperience: false,
    noMedicalAdvice: false,
    followDoctor: false,
    emotionalSupport: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(GUIDELINES_KEY);
    setAccepted(stored === "true");
  }, []);

  const allChecked = Object.values(checkboxes).every(Boolean);

  const handleAccept = () => {
    localStorage.setItem(GUIDELINES_KEY, "true");
    setAccepted(true);
    onAccept?.();
  };

  // Still loading
  if (accepted === null) {
    return null;
  }

  // Already accepted
  if (accepted) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-purple-100 rounded-full p-3 w-fit mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-purple-600">
              <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Guide Guidelines</h2>
          <p className="text-gray-600 mt-2">
            Please review these guidelines before sharing your recovery story
          </p>
        </div>

        {/* Guidelines */}
        <div className="space-y-4 mb-6">
          {/* Guideline 1 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
              Share Personal Experiences
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              Frame everything as <strong>your personal journey</strong>. Use phrases like:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <span className="text-green-500">&#10003;</span>
                &quot;In my experience...&quot;
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">&#10003;</span>
                &quot;What worked for me was...&quot;
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">&#10003;</span>
                &quot;I found that...&quot;
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">&#10003;</span>
                &quot;My doctor recommended...&quot;
              </li>
            </ul>
          </div>

          {/* Guideline 2 */}
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="bg-red-100 text-red-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
              Avoid Medical Directives
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              <strong>Never</strong> tell others what they should do medically. Avoid phrases like:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <span className="text-red-500">&#10007;</span>
                &quot;You should take...&quot;
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">&#10007;</span>
                &quot;Don&apos;t listen to your doctor about...&quot;
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">&#10007;</span>
                &quot;You need to stop taking...&quot;
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">&#10007;</span>
                &quot;The correct dosage is...&quot;
              </li>
            </ul>
          </div>

          {/* Guideline 3 */}
          <div className="bg-amber-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
              Always Encourage Professional Consultation
            </h3>
            <p className="text-gray-600 text-sm">
              Remind viewers that everyone&apos;s situation is different and they should always follow
              their own doctor&apos;s advice. Include phrases like &quot;check with your doctor&quot; or
              &quot;everyone&apos;s recovery is different.&quot;
            </p>
          </div>

          {/* Guideline 4 */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
              Focus on Emotional Support
            </h3>
            <p className="text-gray-600 text-sm">
              Our community is about the <strong>emotional journey</strong> of recovery - the fears, victories,
              setbacks, and personal growth. Share how you <em>felt</em>, not what others should <em>do</em>.
            </p>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="border-t pt-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Please confirm you understand:</p>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checkboxes.personalExperience}
                onChange={(e) => setCheckboxes(prev => ({ ...prev, personalExperience: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">
                I will frame all content as my personal experience, not general advice
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checkboxes.noMedicalAdvice}
                onChange={(e) => setCheckboxes(prev => ({ ...prev, noMedicalAdvice: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">
                I will not give medical directives, dosage recommendations, or tell viewers to ignore their doctors
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checkboxes.followDoctor}
                onChange={(e) => setCheckboxes(prev => ({ ...prev, followDoctor: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">
                I will encourage viewers to consult their healthcare providers for medical decisions
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checkboxes.emotionalSupport}
                onChange={(e) => setCheckboxes(prev => ({ ...prev, emotionalSupport: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">
                I understand the focus is on emotional support and personal experiences, not medical guidance
              </span>
            </label>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleAccept}
          disabled={!allChecked}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
            allChecked
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          I Agree to These Guidelines
        </button>
      </div>
    </div>
  );
}
