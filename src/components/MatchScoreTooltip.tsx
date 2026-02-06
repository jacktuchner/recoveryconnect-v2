"use client";

import { useState } from "react";

export default function MatchScoreTooltip({ breakdown }: { breakdown: { attribute: string; matched: boolean; weight: number }[] }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.preventDefault(); setShow(!show); }}
        className="ml-1 text-gray-400 hover:text-gray-600"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {show && (
        <div className="absolute right-0 top-6 z-50 w-56 bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-left">
          <p className="text-xs font-medium text-gray-700 mb-2">Match breakdown:</p>
          <div className="space-y-1">
            {breakdown.map((item) => (
              <div key={item.attribute} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{item.attribute}</span>
                <span className={item.matched ? "text-green-600" : "text-gray-400"}>
                  {item.matched ? "\u2713" : "\u2014"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
