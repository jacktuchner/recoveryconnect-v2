"use client";

import { useState } from "react";
import FeatureRequestModal from "./FeatureRequestModal";

interface FeatureRequestButtonProps {
  defaultType?: "condition" | "feature";
  variant?: "dashed" | "link";
  label: string;
}

export default function FeatureRequestButton({
  defaultType = "condition",
  variant = "dashed",
  label,
}: FeatureRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === "dashed" ? (
        <button
          onClick={() => setIsOpen(true)}
          className="border-2 border-dashed border-gray-300 rounded-full px-6 py-2.5 text-sm font-medium text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors"
        >
          {label}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="hover:text-white transition-colors"
        >
          {label}
        </button>
      )}
      <FeatureRequestModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultType={defaultType}
      />
    </>
  );
}
