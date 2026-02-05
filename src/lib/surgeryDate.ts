/**
 * Calculate the time since surgery category from a surgery date
 */
export function getTimeSinceSurgery(surgeryDate: Date | string | null): string | null {
  if (!surgeryDate) return null;

  const surgery = typeof surgeryDate === "string" ? new Date(surgeryDate) : surgeryDate;
  const now = new Date();
  const diffMs = now.getTime() - surgery.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Future surgery date
  if (diffDays < 0) {
    return "Pre-surgery";
  }

  // Less than 1 month (30 days)
  if (diffDays < 30) {
    return "Less than 1 month";
  }

  // 1-3 months (30-90 days)
  if (diffDays < 90) {
    return "1-3 months";
  }

  // 3-6 months (90-180 days)
  if (diffDays < 180) {
    return "3-6 months";
  }

  // 6-12 months (180-365 days)
  if (diffDays < 365) {
    return "6-12 months";
  }

  // 1-2 years (365-730 days)
  if (diffDays < 730) {
    return "1-2 years";
  }

  // 2+ years
  return "2+ years";
}

/**
 * Get a human-readable description of time since surgery
 * Returns week-based labels for the first 12 weeks, then month/year labels
 */
export function getTimeSinceSurgeryLabel(surgeryDate: Date | string | null): string | null {
  if (!surgeryDate) return null;

  const surgery = typeof surgeryDate === "string" ? new Date(surgeryDate) : surgeryDate;
  const now = new Date();
  const diffMs = now.getTime() - surgery.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Future surgery date
  if (diffDays < 0) {
    const daysUntil = Math.abs(diffDays);
    if (daysUntil <= 1) return "Surgery tomorrow";
    if (daysUntil < 7) return `Surgery in ${daysUntil} days`;
    if (daysUntil < 28) return `Surgery in ${Math.ceil(daysUntil / 7)} weeks`;
    return "Surgery scheduled";
  }

  // Surgery day
  if (diffDays === 0) return "Surgery day";

  // Week 1-12 (first 84 days)
  if (diffDays <= 84) {
    const week = Math.ceil(diffDays / 7);
    return `Week ${week}`;
  }

  // Months 3-11
  const months = Math.floor(diffDays / 30);
  if (months < 12) {
    return `${months} months`;
  }

  // Years
  const years = Math.floor(diffDays / 365);
  if (years === 1) return "1 year";
  return `${years}+ years`;
}

/**
 * Get the current recovery week number (1-12) from surgery date
 * Returns null if pre-surgery or beyond 12 weeks
 */
export function getCurrentRecoveryWeek(surgeryDate: Date | string | null): number | null {
  if (!surgeryDate) return null;

  const surgery = typeof surgeryDate === "string" ? new Date(surgeryDate) : surgeryDate;
  const now = new Date();
  const diffMs = now.getTime() - surgery.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Pre-surgery or surgery day
  if (diffDays < 1) return null;

  // Week 1-12 (days 1-84)
  if (diffDays <= 84) {
    return Math.ceil(diffDays / 7);
  }

  // Beyond 12 weeks
  return null;
}

/**
 * Format a surgery date for display
 */
export function formatSurgeryDate(surgeryDate: Date | string | null): string | null {
  if (!surgeryDate) return null;
  const date = typeof surgeryDate === "string" ? new Date(surgeryDate) : surgeryDate;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Check if two people are in a similar recovery stage (for matching)
 * Returns a score from 0 to 1
 */
export function recoveryStageProximity(
  date1: Date | string | null,
  date2: Date | string | null
): number {
  if (!date1 || !date2) return 0;

  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;

  const now = new Date();
  const days1 = Math.floor((now.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  const days2 = Math.floor((now.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));

  // If either is pre-surgery, no match
  if (days1 < 0 || days2 < 0) return 0;

  const diff = Math.abs(days1 - days2);

  // Within 2 weeks: perfect match
  if (diff <= 14) return 1;

  // Within 1 month: great match
  if (diff <= 30) return 0.8;

  // Within 2 months: good match
  if (diff <= 60) return 0.6;

  // Within 3 months: okay match
  if (diff <= 90) return 0.4;

  // Within 6 months: weak match
  if (diff <= 180) return 0.2;

  // More than 6 months apart
  return 0;
}
