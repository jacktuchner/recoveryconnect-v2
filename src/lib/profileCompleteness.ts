export interface ProfileCompletenessResult {
  isComplete: boolean;
  missingFields: string[];
}

export function checkProfileCompleteness(profile: {
  procedureTypes?: string[];
  procedureType?: string;
  ageRange?: string;
  gender?: string | null;
} | null): ProfileCompletenessResult {
  if (!profile) {
    return { isComplete: false, missingFields: ["profile"] };
  }

  const missingFields: string[] = [];

  const hasProcedure =
    (profile.procedureTypes && profile.procedureTypes.length > 0) ||
    (profile.procedureType && profile.procedureType !== "Unknown");
  if (!hasProcedure) {
    missingFields.push("procedure");
  }

  if (!profile.ageRange || profile.ageRange === "Not set") {
    missingFields.push("age range");
  }

  if (!profile.gender) {
    missingFields.push("gender");
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}
