"use client";

import { useState } from "react";
import {
  PROCEDURE_TYPES, AGE_RANGES, GENDERS, ACTIVITY_LEVELS, RECOVERY_GOALS, COMPLICATING_FACTORS, LIFESTYLE_CONTEXTS,
  CONDITION_CATEGORIES, CHRONIC_PAIN_CONDITIONS, CHRONIC_PAIN_DETAILS, CHRONIC_PAIN_GOALS, CHRONIC_PAIN_COMPLICATING_FACTORS,
  PROCEDURE_DETAILS, isChronicPainCondition,
} from "@/lib/constants";
import { getTimeSinceSurgery, getTimeSinceSurgeryLabel, getTimeSinceDiagnosisLabel } from "@/lib/surgeryDate";

interface ProfileWizardProps {
  initialData?: {
    conditionCategory?: string;
    procedureType?: string;
    procedureDetails?: string;
    surgeryDate?: string;
    ageRange?: string;
    gender?: string;
    activityLevel?: string;
    recoveryGoals?: string[];
    complicatingFactors?: string[];
    lifestyleContext?: string[];
  };
  onComplete: (data: any) => Promise<void>;
  onCancel?: () => void;
  error?: string | null;
}

type Stage = 0 | 1 | 2 | 3;

export default function ProfileWizard({ initialData, onComplete, onCancel, error }: ProfileWizardProps) {
  const [stage, setStage] = useState<Stage>(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    conditionCategory: initialData?.conditionCategory || "",
    procedureType: initialData?.procedureType || "",
    procedureDetails: initialData?.procedureDetails || "",
    surgeryDate: initialData?.surgeryDate || "",
    ageRange: initialData?.ageRange || "",
    gender: initialData?.gender || "",
    activityLevel: initialData?.activityLevel || "RECREATIONAL",
    recoveryGoals: initialData?.recoveryGoals || [],
    complicatingFactors: initialData?.complicatingFactors || [],
    lifestyleContext: initialData?.lifestyleContext || [],
  });

  const isChronicPain = form.procedureType
    ? isChronicPainCondition(form.procedureType)
    : form.conditionCategory === "CHRONIC_PAIN";

  const detailsOptions = isChronicPain
    ? (CHRONIC_PAIN_DETAILS[form.procedureType] || [])
    : (PROCEDURE_DETAILS[form.procedureType] || []);
  const goalsOptions = isChronicPain ? CHRONIC_PAIN_GOALS : RECOVERY_GOALS;
  const factorsOptions = isChronicPain ? CHRONIC_PAIN_COMPLICATING_FACTORS : COMPLICATING_FACTORS;

  function toggleArrayItem(key: "recoveryGoals" | "complicatingFactors" | "lifestyleContext", value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v: string) => v !== value)
        : [...prev[key], value],
    }));
  }

  function canProceedFromStage0() {
    return form.conditionCategory !== "";
  }

  function canProceedFromStage1() {
    return form.procedureType && form.ageRange && form.gender && form.activityLevel;
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const dataToSave = {
        ...form,
        timeSinceSurgery: form.surgeryDate ? getTimeSinceSurgery(form.surgeryDate) : null,
      };
      await onComplete(dataToSave);
    } catch (err) {
      // Error is handled by parent component via error prop
      console.error("Profile save error:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleNext() {
    if (stage === 0 && canProceedFromStage0()) {
      setStage(1);
    } else if (stage === 1 && canProceedFromStage1()) {
      setStage(2);
    } else if (stage === 2) {
      setStage(3);
    } else if (stage === 3) {
      handleComplete();
    }
  }

  function handleBack() {
    if (stage === 1) setStage(0);
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
          <span className="text-sm text-teal-100">Step {stage + 1} of 4</span>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((s) => (
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
          <span className={`text-xs ${stage === 0 ? "text-white font-medium" : "text-teal-200"}`}>
            Type
          </span>
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
        {/* Stage 0: Condition Category */}
        {stage === 0 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                What primarily brings you to RecoveryConnect? You can add additional conditions or procedures later from your dashboard.
              </p>
            </div>

            <div className="grid gap-3">
              {CONDITION_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm((f) => ({
                    ...f,
                    conditionCategory: cat.value,
                    procedureType: "",
                    procedureDetails: "",
                    recoveryGoals: [],
                    complicatingFactors: [],
                  }))}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    form.conditionCategory === cat.value
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className={`font-semibold ${form.conditionCategory === cat.value ? "text-teal-900" : "text-gray-900"}`}>
                    {cat.label}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {cat.value === "SURGERY"
                      ? "Recovering from a surgical procedure"
                      : "Living with an ongoing condition"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stage 1: Basics (Required) */}
        {stage === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                {isChronicPain
                  ? "Tell us about your condition. This helps us match you with relevant content."
                  : "Tell us the basics about your surgery. This helps us match you with relevant content."}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isChronicPain ? "Condition" : "Procedure Type"} <span className="text-red-500">*</span>
              </label>
              <select
                value={form.procedureType}
                onChange={(e) => setForm((f) => ({ ...f, procedureType: e.target.value, procedureDetails: "" }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">{isChronicPain ? "Select your condition" : "Select your procedure"}</option>
                {(isChronicPain ? CHRONIC_PAIN_CONDITIONS : PROCEDURE_TYPES).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isChronicPain ? "Condition Details" : "Procedure Details"} <span className="text-gray-400">(optional)</span>
              </label>
              {detailsOptions.length > 0 ? (
                <select
                  value={form.procedureDetails}
                  onChange={(e) => setForm((f) => ({ ...f, procedureDetails: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Select details...</option>
                  {detailsOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.procedureDetails}
                  onChange={(e) => setForm((f) => ({ ...f, procedureDetails: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder={isChronicPain ? "e.g., Widespread pain, primarily legs" : "e.g., Patellar tendon graft, Anterior approach"}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isChronicPain ? "Diagnosis Date" : "Surgery Date"} <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="date"
                value={form.surgeryDate}
                onChange={(e) => setForm((f) => ({ ...f, surgeryDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              {form.surgeryDate && (
                <p className="mt-1 text-sm text-teal-600 font-medium">
                  {isChronicPain ? getTimeSinceDiagnosisLabel(form.surgeryDate) : getTimeSinceSurgeryLabel(form.surgeryDate)}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {isChronicPain
                  ? "This helps us understand where you are in your journey."
                  : "This helps us understand where you are in your recovery."}
              </p>
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
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Select your gender</option>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
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
                {isChronicPain ? "Your typical activity level on a good day" : "Your typical activity level before surgery"}
              </p>
            </div>
          </div>
        )}

        {/* Stage 2: Goals (Optional) */}
        {stage === 2 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                {isChronicPain
                  ? "What are your goals for managing your condition? Select all that apply."
                  : "What does successful recovery look like for you? Select all that apply."}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {isChronicPain ? "Management Goals" : "Recovery Goals"}
              </label>
              <div className="flex flex-wrap gap-2">
                {goalsOptions.map((g) => (
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
                {factorsOptions.map((f) => (
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

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <div>
            {stage === 0 && onCancel && (
              <button
                onClick={onCancel}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                Cancel
              </button>
            )}
            {stage > 0 && (
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
              disabled={(stage === 0 && !canProceedFromStage0()) || (stage === 1 && !canProceedFromStage1()) || saving}
              className={`
                px-6 py-2.5 rounded-lg font-medium text-sm transition-all
                ${(stage === 0 && !canProceedFromStage0()) || (stage === 1 && !canProceedFromStage1())
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
