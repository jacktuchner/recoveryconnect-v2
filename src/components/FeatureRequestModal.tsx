"use client";

import { useState } from "react";

interface FeatureRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "condition" | "feature";
}

export default function FeatureRequestModal({
  isOpen,
  onClose,
  defaultType = "condition",
}: FeatureRequestModalProps) {
  const [type, setType] = useState<"condition" | "feature">(defaultType);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description: description.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDescription("");
    setEmail("");
    setError("");
    setSubmitted(false);
    setType(defaultType);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
        {/* Close button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {submitted ? "Thank You!" : "Submit a Request"}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600">
              {type === "condition"
                ? "We've received your condition request and will review it soon."
                : "Thanks for your suggestion! We'll review it soon."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Type toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setType("condition")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  type === "condition"
                    ? "bg-teal-100 text-teal-700 border border-teal-300"
                    : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-150"
                }`}
              >
                Request a Condition
              </button>
              <button
                type="button"
                onClick={() => setType("feature")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  type === "feature"
                    ? "bg-purple-100 text-purple-700 border border-purple-300"
                    : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-150"
                }`}
              >
                Suggest a Feature
              </button>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === "condition" ? "What condition would you like to see?" : "What feature would you like?"}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                placeholder={
                  type === "condition"
                    ? "e.g. Endometriosis, Crohn's Disease, Spinal Fusion..."
                    : "e.g. Group video sessions, condition-specific forums..."
                }
                required
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {description.length}/500
              </p>
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="We'll notify you when it's available"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="w-full py-2.5 px-4 rounded-lg font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
