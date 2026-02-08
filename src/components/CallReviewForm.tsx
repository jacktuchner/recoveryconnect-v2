"use client";

import { useState } from "react";

interface CallReviewFormProps {
  callId?: string;
  recordingId?: string;
  contributorId: string;
  contributorName: string;
  onReviewSubmitted: (review: any) => void;
  onCancel?: () => void;
  // Edit mode
  editMode?: boolean;
  existingReview?: {
    id: string;
    rating: number;
    matchRelevance: number;
    helpfulness: number;
    comment: string;
  };
}

export default function CallReviewForm({
  callId,
  recordingId,
  contributorId,
  contributorName,
  onReviewSubmitted,
  onCancel,
  editMode = false,
  existingReview,
}: CallReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [matchRelevance, setMatchRelevance] = useState(existingReview?.matchRelevance || 0);
  const [helpfulness, setHelpfulness] = useState(existingReview?.helpfulness || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [hoveredMatch, setHoveredMatch] = useState(0);
  const [hoveredHelp, setHoveredHelp] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function StarInput({
    label,
    value,
    hovered,
    onChange,
    onHover,
  }: {
    label: string;
    value: number;
    hovered: number;
    onChange: (v: number) => void;
    onHover: (v: number) => void;
  }) {
    return (
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">{label}</label>
        <div className="flex gap-0.5" onMouseLeave={() => onHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => onHover(star)}
              className="text-lg focus:outline-none"
            >
              <span className={star <= (hovered || value) ? "text-yellow-400" : "text-gray-300"}>
                {star <= (hovered || value) ? "\u2605" : "\u2606"}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Please select an overall rating");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (editMode && existingReview) {
        const res = await fetch(`/api/reviews/${existingReview.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating,
            matchRelevance: matchRelevance || null,
            helpfulness: helpfulness || null,
            comment: comment.trim() || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update review");
        }

        const updated = await res.json();
        onReviewSubmitted(updated);
      } else {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectId: contributorId,
            callId: callId || undefined,
            recordingId: recordingId || undefined,
            rating,
            matchRelevance: matchRelevance || null,
            helpfulness: helpfulness || null,
            comment: comment.trim() || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to submit review");
        }

        const review = await res.json();
        onReviewSubmitted(review);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium text-gray-700">
        {editMode ? "Edit your review" : `Review your experience with ${contributorName}`}
      </p>

      <div className="grid grid-cols-3 gap-4">
        <StarInput
          label="Overall Rating *"
          value={rating}
          hovered={hoveredRating}
          onChange={setRating}
          onHover={setHoveredRating}
        />
        <StarInput
          label="Match Relevance"
          value={matchRelevance}
          hovered={hoveredMatch}
          onChange={setMatchRelevance}
          onHover={setHoveredMatch}
        />
        <StarInput
          label="Helpfulness"
          value={helpfulness}
          hovered={hoveredHelp}
          onChange={setHelpfulness}
          onHover={setHoveredHelp}
        />
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        rows={3}
        placeholder="Share your thoughts about this experience..."
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || rating < 1}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
        >
          {submitting ? "Submitting..." : editMode ? "Update Review" : "Submit Review"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
