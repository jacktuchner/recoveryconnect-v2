"use client";

import { useState } from "react";
import { PROCEDURE_TYPES, AGE_RANGES, ACTIVITY_LEVELS, RECORDING_CATEGORIES } from "@/lib/constants";

interface FilterSidebarProps {
  filters: {
    procedures: string[];
    ageRanges: string[];
    activityLevels: string[];
    categories: string[];
  };
  onFilterChange: (key: string, values: string[]) => void;
  showCategory?: boolean;
}

function FilterSection({
  title,
  options,
  selected,
  onChange,
  defaultExpanded = true
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="border-b border-gray-100 pb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-sm font-semibold text-gray-900">
          {title}
          {selected.length > 0 && (
            <span className="ml-2 text-xs font-normal text-teal-600">
              ({selected.length})
            </span>
          )}
        </h3>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggleOption(option.value)}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterSidebar({ filters, onFilterChange, showCategory = true }: FilterSidebarProps) {
  const procedureOptions = PROCEDURE_TYPES.map((p) => ({ value: p, label: p }));
  const ageOptions = AGE_RANGES.map((a) => ({ value: a, label: a }));
  const activityOptions = ACTIVITY_LEVELS.map((a) => ({ value: a.value, label: a.label }));
  const categoryOptions = RECORDING_CATEGORIES.map((c) => ({ value: c.value, label: c.label }));

  const totalFilters =
    filters.procedures.length +
    filters.ageRanges.length +
    filters.activityLevels.length +
    filters.categories.length;

  const clearAll = () => {
    onFilterChange("procedures", []);
    onFilterChange("ageRanges", []);
    onFilterChange("activityLevels", []);
    onFilterChange("categories", []);
  };

  return (
    <div className="space-y-4">
      {totalFilters > 0 && (
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <span className="text-sm text-gray-600">
            {totalFilters} filter{totalFilters !== 1 ? "s" : ""} active
          </span>
          <button
            onClick={clearAll}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      <FilterSection
        title="Procedure"
        options={procedureOptions}
        selected={filters.procedures}
        onChange={(values) => onFilterChange("procedures", values)}
      />

      <FilterSection
        title="Age Range"
        options={ageOptions}
        selected={filters.ageRanges}
        onChange={(values) => onFilterChange("ageRanges", values)}
      />

      <FilterSection
        title="Activity Level"
        options={activityOptions}
        selected={filters.activityLevels}
        onChange={(values) => onFilterChange("activityLevels", values)}
      />

      {showCategory && (
        <FilterSection
          title="Category"
          options={categoryOptions}
          selected={filters.categories}
          onChange={(values) => onFilterChange("categories", values)}
        />
      )}
    </div>
  );
}
