"use client";

import { useState, useEffect, useRef } from "react";
import {
  PROCEDURE_TYPES,
  RECOMMENDATION_CATEGORIES,
  RECOMMENDATION_PRICE_RANGES,
  LOCATION_BASED_CATEGORIES,
} from "@/lib/constants";

interface Endorsement {
  id: string;
  guideId: string;
  comment?: string;
  recoveryPhase?: string;
  guide: { id: string; name: string; image?: string };
}

interface Recommendation {
  id: string;
  name: string;
  category: string;
  procedureType: string;
  description?: string;
  location?: string;
  url?: string;
  priceRange?: string;
  endorsementCount: number;
  helpfulCount: number;
  endorsements: Endorsement[];
}

interface Props {
  recommendations: Recommendation[];
  guideProcedures: string[];
  onRecommendationsUpdate: (recs: Recommendation[]) => void;
}

const RECOVERY_PHASES = ["Pre-surgery", "0-2 weeks", "2-6 weeks", "6-12 weeks", "3-6 months", "6-12 months", "1+ year"];

export default function RecommendationsSection({ recommendations, guideProcedures, onRecommendationsUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "RECOVERY_PRODUCT",
    procedureType: guideProcedures[0] || "",
    description: "",
    location: "",
    url: "",
    priceRange: "",
    comment: "",
    recoveryPhase: "",
  });

  const [suggestions, setSuggestions] = useState<{ id: string; name: string; category: string; endorsementCount: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedExisting, setSelectedExisting] = useState<string | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isLocationCategory = (LOCATION_BASED_CATEGORIES as readonly string[]).includes(form.category);

  // Search for existing recommendations as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (form.name.length < 3 || !form.procedureType || selectedExisting) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          search: form.name,
          procedure: form.procedureType,
          page: "1",
        });
        const res = await fetch(`/api/recommendations?${params}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(
            (data.recommendations || []).map((r: any) => ({
              id: r.id,
              name: r.name,
              category: r.category,
              endorsementCount: r.endorsementCount,
            }))
          );
          setShowSuggestions(true);
        }
      } catch {
        // ignore
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form.name, form.procedureType, selectedExisting]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectSuggestion(suggestion: { id: string; name: string; category: string }) {
    setForm((f) => ({ ...f, name: suggestion.name, category: suggestion.category }));
    setSelectedExisting(suggestion.id);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  async function createRecommendation() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add recommendation");
        return;
      }

      const newRec = await res.json();
      onRecommendationsUpdate([newRec, ...recommendations]);
      setShowForm(false);
      setForm({
        name: "",
        category: "RECOVERY_PRODUCT",
        procedureType: guideProcedures[0] || "",
        description: "",
        location: "",
        url: "",
        priceRange: "",
        comment: "",
        recoveryPhase: "",
      });
    } catch {
      setError("Failed to add recommendation");
    } finally {
      setSaving(false);
    }
  }

  async function removeEndorsement(recId: string) {
    if (!confirm("Remove your endorsement from this recommendation?")) return;
    setRemovingId(recId);
    try {
      const res = await fetch(`/api/recommendations/${recId}/endorse`, {
        method: "DELETE",
      });

      if (res.ok) {
        onRecommendationsUpdate(recommendations.filter((r) => r.id !== recId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  }

  const categoryLabel = (value: string) =>
    RECOMMENDATION_CATEGORIES.find((c) => c.value === value)?.label || value;

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Recovery Recommendations</h2>
          <p className="text-sm text-gray-500 mt-1">Products, providers, and resources you recommend for recovery</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium"
          >
            Add Recommendation
          </button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900">New Recommendation</h3>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 relative" ref={suggestionsRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }));
                  setSelectedExisting(null);
                }}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                placeholder="e.g., GameReady Ice Machine"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              {selectedExisting && (
                <p className="text-xs text-teal-600 mt-1">
                  Adding your endorsement to an existing recommendation
                </p>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <p className="text-xs text-gray-400 px-3 pt-2 pb-1">Existing recommendations — click to endorse</p>
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      className="w-full text-left px-3 py-2 hover:bg-teal-50 transition-colors text-sm"
                    >
                      <span className="font-medium text-gray-900">{s.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {s.endorsementCount} {s.endorsementCount === 1 ? "endorsement" : "endorsements"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {RECOMMENDATION_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {RECOMMENDATION_CATEGORIES.find((c) => c.value === form.category)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What is this recommendation for?</label>
              <select
                value={form.procedureType}
                onChange={(e) => setForm((f) => ({ ...f, procedureType: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {(guideProcedures.length > 0 ? guideProcedures : PROCEDURE_TYPES as unknown as string[]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Why do you recommend this?"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {isLocationCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g., Austin, TX"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL (optional)</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <select
                value={form.priceRange}
                onChange={(e) => setForm((f) => ({ ...f, priceRange: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                {RECOMMENDATION_PRICE_RANGES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 border-t border-gray-200 pt-4 mt-2">
              <p className="text-sm font-medium text-gray-700 mb-3">Your endorsement</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
              <textarea
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="How did this help your recovery?"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recovery Phase</label>
              <select
                value={form.recoveryPhase}
                onChange={(e) => setForm((f) => ({ ...f, recoveryPhase: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                {RECOVERY_PHASES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={createRecommendation}
              disabled={saving || !form.name || !form.procedureType || !form.category}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
            >
              {saving ? "Saving..." : "Add Recommendation"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recommendations List */}
      {recommendations.length > 0 ? (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div key={rec.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-gray-900">{rec.name}</h4>
                    <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                      {categoryLabel(rec.category)}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {rec.procedureType}
                    </span>
                  </div>
                  {rec.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{rec.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{rec.endorsementCount} {rec.endorsementCount === 1 ? "endorsement" : "endorsements"}</span>
                    <span>{rec.helpfulCount} helpful {rec.helpfulCount === 1 ? "vote" : "votes"}</span>
                    {rec.location && <span>{rec.location}</span>}
                    {rec.priceRange && <span>{rec.priceRange}</span>}
                  </div>
                </div>
                <button
                  onClick={() => removeEndorsement(rec.id)}
                  disabled={removingId === rec.id}
                  className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50 ml-2"
                >
                  {removingId === rec.id ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !showForm ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <p className="text-gray-500 text-sm">No recommendations yet. Share products and providers that helped your recovery!</p>
        </div>
      ) : null}
    </section>
  );
}
