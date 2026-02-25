interface ProfileAttributes {
  procedureType: string;
  procedureTypes?: string[];
  procedureDetails?: string | null;
  ageRange: string;
  gender?: string | null;
  activityLevel: string;
  recoveryGoals: string[];
  timeSinceSurgery?: string | null;
  complicatingFactors: string[];
  lifestyleContext: string[];
}

interface MatchResult {
  score: number;
  breakdown: {
    attribute: string;
    matched: boolean;
    weight: number;
  }[];
}

const WEIGHTS = {
  procedureType: 30,
  procedureDetails: 10,
  ageRange: 10,
  gender: 10,
  activityLevel: 15,
  recoveryGoals: 15,
  complicatingFactors: 5,
  lifestyleContext: 5,
};

const AGE_RANGES = ["teens", "20s", "30s", "40s", "50s", "60s", "70s+"];

function ageProximity(a: string, b: string): number {
  const idxA = AGE_RANGES.indexOf(a.toLowerCase());
  const idxB = AGE_RANGES.indexOf(b.toLowerCase());
  if (idxA === -1 || idxB === -1) return 0;
  const diff = Math.abs(idxA - idxB);
  if (diff === 0) return 1;
  if (diff === 1) return 0.7;
  if (diff === 2) return 0.3;
  return 0;
}

function arrayOverlap(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const matches = b.filter((s) => setA.has(s.toLowerCase())).length;
  return matches / Math.max(a.length, b.length);
}

export function calculateMatchScore(
  seeker: ProfileAttributes,
  guide: ProfileAttributes
): MatchResult {
  const breakdown: MatchResult["breakdown"] = [];

  // Procedure type (required match) — check procedureTypes array if available
  const seekerProc = seeker.procedureType.toLowerCase();
  const guideTypes = guide.procedureTypes?.length
    ? guide.procedureTypes.map((t) => t.toLowerCase())
    : [guide.procedureType.toLowerCase()];
  const procMatch = guideTypes.includes(seekerProc);
  breakdown.push({
    attribute: "Procedure type",
    matched: procMatch,
    weight: WEIGHTS.procedureType,
  });

  // Procedure details
  const detailMatch =
    seeker.procedureDetails && guide.procedureDetails
      ? seeker.procedureDetails.toLowerCase() ===
        guide.procedureDetails.toLowerCase()
      : false;
  breakdown.push({
    attribute: "Procedure details",
    matched: detailMatch,
    weight: WEIGHTS.procedureDetails,
  });

  // Age range (proximity-based)
  const ageScore = ageProximity(seeker.ageRange, guide.ageRange);
  breakdown.push({
    attribute: "Age range",
    matched: ageScore >= 0.7,
    weight: WEIGHTS.ageRange,
  });

  // Activity level
  const activityMatch = seeker.activityLevel === guide.activityLevel;
  breakdown.push({
    attribute: "Activity level",
    matched: activityMatch,
    weight: WEIGHTS.activityLevel,
  });

  // Gender
  const seekerGender = seeker.gender;
  const guideGender = guide.gender;
  const genderNeutral = !seekerGender || !guideGender || seekerGender === "OTHER" || guideGender === "OTHER";
  const genderScore = genderNeutral ? 0.5 : seekerGender === guideGender ? 1.0 : 0.0;
  breakdown.push({
    attribute: "Gender",
    matched: genderScore >= 0.5,
    weight: WEIGHTS.gender,
  });

  // Recovery goals
  const goalsOverlap = arrayOverlap(
    seeker.recoveryGoals,
    guide.recoveryGoals
  );
  breakdown.push({
    attribute: "Recovery goals",
    matched: goalsOverlap >= 0.5,
    weight: WEIGHTS.recoveryGoals,
  });

  // Complicating factors
  const complicationsOverlap = arrayOverlap(
    seeker.complicatingFactors,
    guide.complicatingFactors
  );
  breakdown.push({
    attribute: "Complicating factors",
    matched: complicationsOverlap >= 0.5,
    weight: WEIGHTS.complicatingFactors,
  });

  // Lifestyle context
  const lifestyleOverlap = arrayOverlap(
    seeker.lifestyleContext,
    guide.lifestyleContext
  );
  breakdown.push({
    attribute: "Lifestyle context",
    matched: lifestyleOverlap >= 0.5,
    weight: WEIGHTS.lifestyleContext,
  });

  // Calculate total score
  const totalWeight = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  const earnedWeight =
    (procMatch ? WEIGHTS.procedureType : 0) +
    (detailMatch ? WEIGHTS.procedureDetails : 0) +
    ageScore * WEIGHTS.ageRange +
    genderScore * WEIGHTS.gender +
    (activityMatch ? WEIGHTS.activityLevel : 0) +
    goalsOverlap * WEIGHTS.recoveryGoals +
    complicationsOverlap * WEIGHTS.complicatingFactors +
    lifestyleOverlap * WEIGHTS.lifestyleContext;

  const score = Math.round((earnedWeight / totalWeight) * 100);

  return { score, breakdown };
}
