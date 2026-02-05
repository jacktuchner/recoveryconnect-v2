-- Add procedure-specific profiles as JSON
-- Run this in your Supabase SQL Editor

ALTER TABLE "Profile"
ADD COLUMN IF NOT EXISTS "procedureProfiles" JSONB DEFAULT '{}';

-- Example structure of procedureProfiles:
-- {
--   "ACL Reconstruction": {
--     "procedureDetails": "Patellar tendon graft",
--     "timeSinceSurgery": "6 months",
--     "recoveryGoals": ["Return to sports", "Run again"],
--     "complicatingFactors": ["Previous injury"]
--   },
--   "Hip Replacement": {
--     "procedureDetails": "Anterior approach",
--     "timeSinceSurgery": "2 weeks",
--     "recoveryGoals": ["Walk pain-free"],
--     "complicatingFactors": ["Diabetes"]
--   }
-- }

COMMENT ON COLUMN "Profile"."procedureProfiles" IS 'JSON object storing per-procedure attributes (goals, factors, details, time since surgery)';
