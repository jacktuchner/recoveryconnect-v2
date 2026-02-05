export const PROCEDURE_TYPES = [
  "ACL Reconstruction",
  "Total Hip Replacement",
  "Total Knee Replacement",
  "Spinal Fusion",
  "Rotator Cuff Repair",
  "Meniscus Repair",
  "Shoulder Labrum Repair",
  "Ankle Reconstruction",
  "Carpal Tunnel Release",
  "Hernia Repair",
] as const;

export const PROCEDURE_DETAILS: Record<string, string[]> = {
  "ACL Reconstruction": [
    "Patellar tendon autograft",
    "Hamstring tendon autograft",
    "Quadriceps tendon autograft",
    "Allograft",
  ],
  "Total Hip Replacement": [
    "Anterior approach",
    "Posterior approach",
    "Lateral approach",
    "Revision surgery",
  ],
  "Spinal Fusion": [
    "Lumbar (L4-L5)",
    "Lumbar (L5-S1)",
    "Cervical",
    "Multi-level",
  ],
};

export const AGE_RANGES = [
  "Teens",
  "20s",
  "30s",
  "40s",
  "50s",
  "60s",
  "70s+",
] as const;

export const ACTIVITY_LEVELS = [
  { value: "SEDENTARY", label: "Sedentary" },
  { value: "RECREATIONAL", label: "Recreational" },
  { value: "COMPETITIVE_ATHLETE", label: "Competitive Athlete" },
  { value: "PROFESSIONAL_ATHLETE", label: "Professional Athlete" },
] as const;

export const RECOVERY_GOALS = [
  "Return to competitive sport",
  "Return to recreational activity",
  "Pain-free daily living",
  "Return to manual labor job",
  "Return to desk job",
  "Play with kids/grandkids",
  "Travel comfortably",
  "Independent living",
  "Return to sexual activity",
] as const;

export const COMPLICATING_FACTORS = [
  "Revision surgery",
  "Bilateral procedure",
  "Previous injuries to same area",
  "Diabetes",
  "Obesity",
  "Osteoporosis",
  "Autoimmune condition",
  "Blood clotting disorder",
] as const;

export const LIFESTYLE_CONTEXTS = [
  "Parent of young kids",
  "Lives alone",
  "Works from home",
  "Physical/manual job",
  "Office/desk job",
  "Caregiver for others",
  "Limited home support",
  "Multi-story home",
  "No car/limited transportation",
] as const;

export const TIME_SINCE_SURGERY = [
  "Less than 1 month",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "1-2 years",
  "2+ years",
] as const;

export const RECORDING_CATEGORIES = [
  { value: "WEEKLY_TIMELINE", label: "Week-by-Week Timeline", description: "What to expect each week of recovery" },
  { value: "WISH_I_KNEW", label: "Things I Wish I Knew", description: "What you wish someone told you before surgery" },
  { value: "PRACTICAL_TIPS", label: "Practical Tips", description: "Sleep positions, meal prep, mobility aids, clothing" },
  { value: "MENTAL_HEALTH", label: "Mental & Emotional Health", description: "Coping with recovery mentally and emotionally" },
  { value: "RETURN_TO_ACTIVITY", label: "Return to Activity", description: "Milestones, setbacks, and getting back to normal" },
  { value: "MISTAKES_AND_LESSONS", label: "Mistakes & Lessons", description: "What you would do differently knowing what you know now" },
] as const;

export const PLATFORM_FEE_PERCENT = 25; // 25% platform commission on calls
export const DEFAULT_CALL_DURATION = 30; // minutes
export const MIN_CALL_RATE = 40;
export const MAX_CALL_RATE = 75;
