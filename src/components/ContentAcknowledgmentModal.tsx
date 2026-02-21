"use client";

import { useState, useEffect } from "react";

const ACKNOWLEDGMENT_KEY = "kizu-disclaimer-acknowledged";

interface ContentAcknowledgmentModalProps {
  children: React.ReactNode;
}

export default function ContentAcknowledgmentModal({ children }: ContentAcknowledgmentModalProps) {
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(ACKNOWLEDGMENT_KEY);
    setAcknowledged(stored === "true");
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem(ACKNOWLEDGMENT_KEY, "true");
    setAcknowledged(true);
  };

  // Still loading
  if (acknowledged === null) {
    return null;
  }

  // Already acknowledged
  if (acknowledged) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-blue-600">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
            Before You Continue
          </h2>

          {/* Content */}
          <div className="text-gray-600 space-y-4 mb-6">
            <p>
              <strong className="text-gray-900">Kizu</strong> is a peer support community where
              people share their personal recovery journeys and emotional experiences.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Important
              </h3>
              <ul className="text-amber-800 text-sm space-y-1">
                <li>Content here is <strong>NOT medical advice</strong></li>
                <li>Always follow your doctor&apos;s instructions</li>
                <li>Consult healthcare professionals for medical decisions</li>
                <li>Individual recovery experiences vary significantly</li>
              </ul>
            </div>

            <p className="text-sm">
              Our community focuses on the <strong>emotional and experiential</strong> aspects of recovery -
              the feelings, challenges, and personal growth that come with healing.
            </p>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={checkboxChecked}
              onChange={(e) => setCheckboxChecked(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              I understand that content on Kizu reflects personal experiences and is not
              a substitute for professional medical advice. I will always consult my healthcare
              provider for medical decisions.
            </span>
          </label>

          {/* Button */}
          <button
            onClick={handleAcknowledge}
            disabled={!checkboxChecked}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              checkboxChecked
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            I Understand - Continue
          </button>
        </div>
      </div>
    </>
  );
}
