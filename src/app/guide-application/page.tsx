"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PROCEDURE_TYPES, CHRONIC_PAIN_CONDITIONS, TIME_SINCE_SURGERY, TIME_SINCE_DIAGNOSIS, GUIDE_AGREEMENT_CLAUSES, GUIDE_AGREEMENT_VERSION } from "@/lib/constants";

export default function GuideApplicationPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // Form state
  const [conditionTypes, setConditionTypes] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [timeSince, setTimeSince] = useState("");
  const [experienceText, setExperienceText] = useState("");
  const [whyGuide, setWhyGuide] = useState("");
  const [contentPlans, setContentPlans] = useState("");
  const [preferredContact, setPreferredContact] = useState("");
  const [proofFiles, setProofFiles] = useState<{ name: string; url: string }[]>([]);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementSignature, setAgreementSignature] = useState("");
  const [signatureDrawn, setSignatureDrawn] = useState(false);

  // Signature pad
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [getCanvasPoint]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasPoint(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineTo(x, y);
    ctx.stroke();
    hasDrawnRef.current = true;
  }, [getCanvasPoint]);

  const stopDrawing = useCallback(() => {
    if (isDrawingRef.current && hasDrawnRef.current) {
      setSignatureDrawn(true);
    }
    isDrawingRef.current = false;
  }, []);

  function clearSignaturePad() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    setSignatureDrawn(false);
  }

  function getSignatureDataUrl(): string | null {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawnRef.current) return null;
    return canvas.toDataURL("image/png");
  }

  // UI state
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const contributorStatus = (session?.user as any)?.contributorStatus;

  useEffect(() => {
    if (authStatus === "loading") return;
    if (authStatus === "unauthenticated") {
      window.location.href = "/auth/signin";
      return;
    }
    // Authenticated — fetch existing application
    fetch("/api/guide-application")
      .then((res) => res.json())
      .then((data) => {
        if (data.application) {
          setExistingApplication(data.application);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authStatus]);

  function toggleConditionType(type: string) {
    setConditionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    // Clear conditions that don't match selected types
    setSelectedConditions((prev) =>
      prev.filter((c) => {
        if (type === "SURGERY" && !conditionTypes.includes("SURGERY")) return true;
        if (type === "CHRONIC_PAIN" && !conditionTypes.includes("CHRONIC_PAIN")) return true;
        return true;
      })
    );
  }

  function toggleCondition(condition: string) {
    setSelectedConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    );
  }

  const availableConditions = [
    ...(conditionTypes.includes("SURGERY") ? PROCEDURE_TYPES.map((p) => p) : []),
    ...(conditionTypes.includes("CHRONIC_PAIN") ? CHRONIC_PAIN_CONDITIONS.map((c) => c) : []),
  ];

  const timeOptions = conditionTypes.includes("CHRONIC_PAIN") && !conditionTypes.includes("SURGERY")
    ? TIME_SINCE_DIAGNOSIS
    : TIME_SINCE_SURGERY;

  // Build combined application text from structured answers
  function buildApplicationText() {
    const parts: string[] = [];
    if (selectedConditions.length > 0) {
      parts.push(`Conditions/Procedures: ${selectedConditions.join(", ")}`);
    }
    if (timeSince) {
      parts.push(`Time since: ${timeSince}`);
    }
    if (experienceText) {
      parts.push(`Experience: ${experienceText}`);
    }
    if (whyGuide) {
      parts.push(`Why I want to be a guide: ${whyGuide}`);
    }
    if (contentPlans) {
      parts.push(`What I plan to share: ${contentPlans}`);
    }
    return parts.join("\n\n");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const res = await fetch("/api/upload/presigned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: `proof-${Date.now()}-${file.name}`,
            contentType: file.type,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const { url, uploadUrl } = await res.json();

        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        setProofFiles((prev) => [...prev, { name: file.name, url }]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  function removeFile(index: number) {
    setProofFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/guide-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationText: buildApplicationText(),
          proofUrls: proofFiles.map((f) => f.url),
          preferredContact,
          agreementAccepted,
          agreementSignature: agreementSignature.trim(),
          agreementSignatureImage: getSignatureDataUrl(),
          agreementVersion: GUIDE_AGREEMENT_VERSION,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit application");
      }

      // Go to guide dashboard — it shows the pending banner
      window.location.href = "/dashboard/guide";
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const isFormValid = selectedConditions.length > 0 && experienceText && preferredContact && agreementAccepted && agreementSignature.trim().length > 0 && signatureDrawn;

  if (authStatus === "loading" || loading) {
    return <div className="max-w-2xl mx-auto px-4 py-8">Loading...</div>;
  }

  // Already approved
  if (contributorStatus === "APPROVED") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <h2 className="text-lg font-bold text-green-800 mb-2">You&apos;re Already Approved</h2>
          <p className="text-green-700 mb-4">Your guide application has been approved. You have full access.</p>
          <button
            onClick={() => router.push("/dashboard/guide")}
            className="bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 font-medium text-sm"
          >
            Go to Guide Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Pending review (either from API or just submitted)
  if (submitted || existingApplication?.status === "PENDING_REVIEW") {
    const appText = existingApplication?.applicationText || buildApplicationText();
    const appContact = existingApplication?.preferredContact || preferredContact;
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-amber-800 mb-2">Application Under Review</h2>
          <p className="text-amber-700 mb-4">
            Your guide application is being reviewed by our team. We&apos;ll reach out to schedule a brief verification call.
            You&apos;ll receive an email once your application is approved.
          </p>
          {appText && (
            <div className="bg-white rounded-lg border border-amber-100 p-4 mb-4">
              <p className="text-sm text-gray-500 mb-1">Your application:</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{appText}</p>
            </div>
          )}
          {appContact && (
            <p className="text-sm text-amber-600">
              Contact provided: {appContact}
            </p>
          )}
          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 font-medium text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isReapply = existingApplication?.status === "REJECTED";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {isReapply ? "Reapply as a Guide" : "Become a Guide"}
        </h1>
        <p className="text-gray-600">
          Share your recovery experience to help others on their journey. We review every application
          to ensure our community gets trustworthy, first-hand guidance.
        </p>
      </div>

      {isReapply && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-700">
            Your previous application was not approved.
            {existingApplication.reviewNote && (
              <span className="block mt-1">Feedback: {existingApplication.reviewNote}</span>
            )}
          </p>
        </div>
      )}

      {/* Process overview */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-5 mb-8">
        <h3 className="font-semibold text-teal-800 mb-3">How it works</h3>
        <ol className="space-y-2 text-sm text-teal-700">
          <li className="flex gap-2">
            <span className="font-bold text-teal-600 flex-shrink-0">1.</span>
            Fill out this application about your experience
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-teal-600 flex-shrink-0">2.</span>
            Optionally upload proof documents (photos, medical records, etc.)
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-teal-600 flex-shrink-0">3.</span>
            Our team reviews your application and schedules a brief verification call (15-30 min)
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-teal-600 flex-shrink-0">4.</span>
            Once approved, you get full guide access with a Verified badge
          </li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Question 1: Condition type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What type of experience do you want to share? <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Select all that apply — you can share about both surgery recovery and autoimmune conditions if relevant to your experience.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => toggleConditionType("SURGERY")}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                conditionTypes.includes("SURGERY")
                  ? "border-teal-600 bg-teal-50 text-teal-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              Surgery Recovery
            </button>
            <button
              type="button"
              onClick={() => toggleConditionType("CHRONIC_PAIN")}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                conditionTypes.includes("CHRONIC_PAIN")
                  ? "border-purple-600 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              Autoimmune Condition
            </button>
          </div>
        </div>

        {/* Question 2: Specific conditions */}
        {conditionTypes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Which specific condition(s) or procedure(s)? <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Select all that apply to your experience.
            </p>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
              {availableConditions.map((condition) => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => toggleCondition(condition)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    selectedConditions.includes(condition)
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
            {selectedConditions.length > 0 && (
              <p className="text-xs text-teal-600 mt-2">
                Selected: {selectedConditions.join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Question 3: Time since */}
        {selectedConditions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How long ago was your surgery or diagnosis?
            </label>
            <select
              value={timeSince}
              onChange={(e) => setTimeSince(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select...</option>
              {timeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}

        {/* Question 4: Tell us about your experience */}
        <div>
          <label htmlFor="experienceText" className="block text-sm font-medium text-gray-700 mb-1">
            Tell us about your experience <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Describe what you went through, how your recovery or management journey has been, and any key moments or insights.
          </p>
          <textarea
            id="experienceText"
            value={experienceText}
            onChange={(e) => setExperienceText(e.target.value)}
            rows={5}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="I had ACL reconstruction in 2024 using a patellar tendon graft. The first 6 weeks were the hardest — I wish someone had told me about..."
          />
        </div>

        {/* Question 5: Why contribute */}
        <div>
          <label htmlFor="whyGuide" className="block text-sm font-medium text-gray-700 mb-1">
            Why do you want to become a guide?
          </label>
          <p className="text-xs text-gray-500 mb-2">
            What motivates you to share your story? This helps us understand your goals.
          </p>
          <textarea
            id="whyGuide"
            value={whyGuide}
            onChange={(e) => setWhyGuide(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="I spent hours searching for real experiences before my surgery and couldn't find much. I want to be the resource I wish I had..."
          />
        </div>

        {/* Question 6: What will you share */}
        <div>
          <label htmlFor="contentPlans" className="block text-sm font-medium text-gray-700 mb-1">
            What kind of content do you plan to share?
          </label>
          <p className="text-xs text-gray-500 mb-2">
            For example: week-by-week timeline, practical tips, things you wish you knew, mental health advice, live calls, etc.
          </p>
          <textarea
            id="contentPlans"
            value={contentPlans}
            onChange={(e) => setContentPlans(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="I'd like to record a week-by-week timeline of my recovery, plus tips on sleep positions, managing pain meds, and returning to running..."
          />
        </div>

        {/* Proof documents */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proof documents <span className="text-gray-400">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Upload photos, medical documents, or other proof of your procedure/condition. This speeds up the review process. Accepted: images, PDFs.
          </p>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              {uploading ? "Uploading..." : "Choose files"}
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          {proofFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {proofFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-700 flex-1 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preferred contact */}
        <div>
          <label htmlFor="preferredContact" className="block text-sm font-medium text-gray-700 mb-1">
            Preferred contact for scheduling verification call <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Email or phone number where we can reach you to schedule a 15-30 minute Zoom call.
          </p>
          <input
            id="preferredContact"
            type="text"
            value={preferredContact}
            onChange={(e) => setPreferredContact(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="email@example.com or (555) 123-4567"
          />
        </div>

        {/* Guide Agreement */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-800 mb-3">Guide Agreement</h3>
          <p className="text-sm text-amber-700 mb-3">
            By applying, you agree to the following terms. Violations may result in immediate termination and forfeiture of earnings.
          </p>
          <ul className="space-y-2 mb-4">
            {GUIDE_AGREEMENT_CLAUSES.map((clause, i) => (
              <li key={i} className="flex gap-2 text-sm text-amber-800">
                <span className="font-bold text-amber-600 flex-shrink-0">{i + 1}.</span>
                {clause}
              </li>
            ))}
          </ul>
          <div className="border-t border-amber-200 pt-4 mt-4 space-y-3">
            <label className="block text-sm font-medium text-amber-800">
              Sign your full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={agreementSignature}
              onChange={(e) => setAgreementSignature(e.target.value)}
              className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 italic"
              placeholder="Type your full legal name"
            />
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">
                Draw your signature <span className="text-red-500">*</span>
              </label>
              <div className="relative border border-amber-300 rounded-lg bg-white overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={160}
                  className="w-full h-32 cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!signatureDrawn && (
                  <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 pointer-events-none">
                    Sign here with your mouse or finger
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={clearSignaturePad}
                className="mt-1.5 text-xs text-amber-600 hover:text-amber-800"
              >
                Clear signature
              </button>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreementAccepted}
                onChange={(e) => setAgreementAccepted(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-amber-800 font-medium">
                I have read and agree to all of the above terms
              </span>
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !isFormValid}
          className="w-full bg-teal-600 text-white px-5 py-3 rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : isReapply ? "Resubmit Application" : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
