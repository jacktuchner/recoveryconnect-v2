"use client";

import { useState } from "react";
import { PROCEDURE_TYPES, AGE_RANGES, ACTIVITY_LEVELS, RECOVERY_GOALS, COMPLICATING_FACTORS, LIFESTYLE_CONTEXTS } from "@/lib/constants";

interface ProfileWizardProps {
  initialData?: {
    procedureType?: string;
    procedureDetails?: string;
    ageRange?: string;
    activityLevel?: string;
    recoveryGoals?: string[];
    complicatingFactors?: string[];
    lifestyleContext?: string[];
  };
  onComplete: (data: any) => void;
  onCancel?: () => void;
}

type Stage = 1 | 2 | 3;

export default function ProfileWizard({ initialData, onComplete, onCancel }: ProfileWizardProps) {
  const [stage, setStage] = useState<Stage>(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    procedureType: initialData?.procedureType || "",
    procedureDetails: initialData?.procedureDetails || "",
    ageRange: initialData?.ageRange || "",
    activityLevel: initialData?.activityLevel || "RECREATIONAL",
    recoveryGoals: initialData?.recoveryGoals || [],
    complicatingFactors: initialData?.complicatingFactors || [],
    lifestyleContext: initialData?.lifestyleContext || [],
  });

  function toggleArrayItem(key: "recoveryGoals" | "complicatingFactors" | "lifestyleContext", value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v: string) => v !== value)
        : [...prev[key], value],
    }));
  }

  function canProceedFromStage1() {
    return form.procedureType && form.ageRange && form.activityLevel;
  }

  async function handleComplete() {
    setSaving(true);
    try {
      await onComplete(form);
    } finally {
      setSaving(false);
    }
  }

  function handleNext() {
    if (stage === 1 && canProceedFromStage1()) {
      setStage(2);
    } else if (stage === 2) {
      setStage(3);
    } else if (stage === 3) {
      handleComplete();
    }
  }

  function handleBack() {
    if (stage === 2) setStage(1);
    if (stage === 3) setStage(2);
  }

  function handleSkip() {
    if (stage === 2) {
      setStage(3);
    } else if (stage === 3) {
      handleComplete();
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Set Up Your Profile</h2>
          <span className="text-sm text-teal-100">Step {stage} of 3</span>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= stage ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Stage Labels */}
        <div className="flex justify-between mt-2">
          <span className={`text-xs ${stage === 1 ? "text-white font-medium" : "text-teal-200"}`}>
            Basics
          </span>
          <span className={`text-xs ${stage === 2 ? "text-white font-medium" : "text-teal-200"}`}>
            Goals
          </span>
          <span className={`text-xs ${stage === 3 ? "text-white font-medium" : "text-teal-200"}`}>
            Context
          </span>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {/* Stage 1: Basics (Required) */}
        {stage === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Tell us the basics about your surgery. This helps us match you with relevant content.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Procedure Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.procedureType}
                onChange={(e) => setForm((f) => ({ ...f, procedureType: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Select your procedure</option>
                {PROCEDURE_TYPES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Procedure Details <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={form.procedureDetails}
                onChange={(e) => setForm((f) => ({ ...f, procedureDetails: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g., Patellar tendon graft, Anterior approach"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age Range <span className="text-red-500">*</span>
              </label>
              <select
                value={form.ageRange}
                onChange={(e) => setForm((f) => ({ ...f, ageRange: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Select your age range</option>
                {AGE_RANGES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Level <span className="text-red-500">*</span>
              </label>
              <select
                value={form.activityLevel}
                onChange={(e) => setForm((f) => ({ ...f, activityLevel: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {ACTIVITY_LEVELS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Your typical activity level before surgery
              </p>
            </div>
          </div>
        )}

        {/* Stage 2: Goals (Optional) */}
        {stage === 2 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                What does successful recovery look like for you? Select all that apply.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Recovery Goals
              </label>
              <div className="flex flex-wrap gap-2">
                {RECOVERY_GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleArrayItem("recoveryGoals", g)}
                    className={`text-sm px-4 py-2 rounded-full border-2 transition-all ${
                      form.recoveryGoals.includes(g)
                        ? "bg-teal-50 border-teal-400 text-teal-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {form.recoveryGoals.includes(g) && (
                      <span className="mr-1">✓</span>
                    )}
                    {g}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {form.recoveryGoals.length === 0
                  ? "Select goals to help us find the most relevant content for you"
                  : `${form.recoveryGoals.length} goal${form.recoveryGoals.length !== 1 ? "s" : ""} selected`}
              </p>
            </div>
          </div>
        )}

        {/* Stage 3: Context (Optional) */}
        {stage === 3 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Help us understand your situation better for more personalized matches.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Complicating Factors
              </label>
              <div className="flex flex-wrap gap-2">
                {COMPLICATING_FACTORS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleArrayItem("complicatingFactors", f)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                      form.complicatingFactors.includes(f)
                        ? "bg-orange-50 border-orange-300 text-orange-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Health factors that may affect your recovery
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Lifestyle Context
              </label>
              <div className="flex flex-wrap gap-2">
                {LIFESTYLE_CONTEXTS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleArrayItem("lifestyleContext", l)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                      form.lifestyleContext.includes(l)
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Your living situation and responsibilities
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <div>
            {stage === 1 && onCancel && (
              <button
                onClick={onCancel}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                Cancel
              </button>
            )}
            {stage > 1 && (
              <button
                onClick={handleBack}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {stage > 1 && (
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                Skip for now
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={(stage === 1 && !canProceedFromStage1()) || saving}
              className={`
                px-6 py-2.5 rounded-lg font-medium text-sm transition-all
                ${stage === 1 && !canProceedFromStage1()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-teal-600 text-white hover:bg-teal-700"
                }
                ${saving ? "opacity-50 cursor-wait" : ""}
              `}
            >
              {saving ? (
                "Saving..."
              ) : stage === 3 ? (
                "Complete Profile"
              ) : (
                <span className="flex items-center gap-1">
                  Continue
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
