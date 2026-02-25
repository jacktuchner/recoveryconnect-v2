import type { User, Profile, Recording, Call, Review } from "@/generated/prisma";

export type UserWithProfile = User & {
  profile: Profile | null;
};

export type RecordingWithGuide = Recording & {
  guide: User & { profile: Profile | null };
  reviews: Review[];
};

export type GuideWithProfile = User & {
  profile: Profile;
  recordings: Recording[];
  reviewsReceived: Review[];
};

export type CallWithParticipants = Call & {
  seeker: User;
  guide: User & { profile: Profile | null };
  reviews: Review[];
};

export type MatchedGuide = GuideWithProfile & {
  matchScore: number;
  matchBreakdown: {
    attribute: string;
    matched: boolean;
    weight: number;
  }[];
};
