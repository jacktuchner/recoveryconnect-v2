"use client";

import { useState, useEffect } from "react";
import { getRecordingCategoriesForCondition } from "@/lib/constants";

interface FaqPrompt {
  id: string;
  question: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

interface FaqPromptSelectorProps {
  onSelect: (prompt: FaqPrompt | null, category: string) => void;
  selectedPromptId?: string | null;
  conditionType?: string;
}

export default function FaqPromptSelector({ onSelect, selectedPromptId, conditionType }: FaqPromptSelectorProps) {
  const [prompts, setPrompts] = useState<FaqPrompt[]>([]);
  const [groupedPrompts, setGroupedPrompts] = useState<Record<string, FaqPrompt[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("WEEKLY_TIMELINE");

  const categories = getRecordingCategoriesForCondition(conditionType || "SURGERY");

  useEffect(() => {
    async function fetchPrompts() {
      try {
        const params = conditionType ? `?conditionType=${conditionType}` : "";
        const res = await fetch(`/api/faq-prompts${params}`);
        if (res.ok) {
          const data = await res.json();
          setPrompts(data.prompts);
          setGroupedPrompts(data.grouped);
        }
      } catch (err) {
        console.error("Error fetching FAQ prompts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrompts();
  }, [conditionType]);

  const getCategoryLabel = (categoryValue: string) => {
    const cat = categories.find((c) => c.value === categoryValue);
    return cat ? cat.label : categoryValue.replace(/_/g, " ");
  };

  const getCategoryDescription = (categoryValue: string) => {
    const cat = categories.find((c) => c.value === categoryValue);
    return cat?.description || "";
  };

  const handlePromptSelect = (prompt: FaqPrompt) => {
    onSelect(prompt, prompt.category);
  };

  const handleSkip = () => {
    onSelect(null, selectedCategory);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
        Loading prompts...
      </div>
    );
  }

  const hasPrompts = prompts.length > 0;

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          What would you like to talk about?
        </h3>
        <p className="text-sm text-gray-500">
          Choose a prompt below, or skip to record something else
        </p>
      </div>

      {/* Category selection */}
      <div className="space-y-3">
        {categories.map((category) => {
          const categoryPrompts = groupedPrompts[category.value] || [];
          const isExpanded = expandedCategory === category.value;
          const isSelected = selectedCategory === category.value;

          return (
            <div key={category.value} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => handleCategorySelect(category.value)}
                className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${
                  isSelected ? "bg-teal-50 border-teal-200" : "bg-white hover:bg-gray-50"
                }`}
              >
                <div>
                  <p className={`font-medium ${isSelected ? "text-teal-700" : "text-gray-900"}`}>
                    {category.label}
                  </p>
                  <p className="text-xs text-gray-500">{category.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {hasPrompts && categoryPrompts.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {categoryPrompts.length} prompt{categoryPrompts.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded prompts list */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50">
                  {categoryPrompts.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {categoryPrompts.map((prompt) => (
                        <button
                          key={prompt.id}
                          onClick={() => handlePromptSelect(prompt)}
                          className={`w-full px-3 py-2.5 text-left text-sm rounded-lg transition-colors ${
                            selectedPromptId === prompt.id
                              ? "bg-teal-100 text-teal-800 border border-teal-300"
                              : "bg-white hover:bg-teal-50 border border-gray-200"
                          }`}
                        >
                          &ldquo;{prompt.question}&rdquo;
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500 mb-2">No prompts available for this category yet.</p>
                      <button
                        onClick={() => onSelect(null, category.value)}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                      >
                        Record your own for this category
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Skip option */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleSkip}
          className="w-full px-4 py-3 text-center text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Skip prompts and record something else
        </button>
      </div>
    </div>
  );
}
