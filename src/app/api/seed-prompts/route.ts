import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const faqPrompts = [
  // ─── SURGERY PROMPTS ───

  // WEEKLY_TIMELINE (surgery-specific)
  { question: "How did you feel 24 hours after surgery?", category: "WEEKLY_TIMELINE", sortOrder: 1, conditionType: "SURGERY" },
  { question: "What was week 1 of recovery like?", category: "WEEKLY_TIMELINE", sortOrder: 2, conditionType: "SURGERY" },
  { question: "What changed between week 2 and week 4?", category: "WEEKLY_TIMELINE", sortOrder: 3, conditionType: "SURGERY" },
  { question: "What were months 2-3 like in your recovery?", category: "WEEKLY_TIMELINE", sortOrder: 4, conditionType: "SURGERY" },

  // PRACTICAL_TIPS (surgery-specific)
  { question: "Tips for caring for your other arm during recovery?", category: "PRACTICAL_TIPS", sortOrder: 1, conditionType: "SURGERY" },
  { question: "How did you handle showering and personal care?", category: "PRACTICAL_TIPS", sortOrder: 2, conditionType: "SURGERY" },
  // PRACTICAL_TIPS (shared)
  { question: "What sleep positions worked best for you?", category: "PRACTICAL_TIPS", sortOrder: 3, conditionType: "BOTH" },
  { question: "What equipment or tools made recovery easier?", category: "PRACTICAL_TIPS", sortOrder: 4, conditionType: "BOTH" },

  // WISH_I_KNEW (surgery-specific)
  { question: "What do you wish someone had told you before surgery?", category: "WISH_I_KNEW", sortOrder: 1, conditionType: "SURGERY" },
  { question: "What surprised you most about recovery?", category: "WISH_I_KNEW", sortOrder: 2, conditionType: "SURGERY" },
  { question: "What would you do differently if you could start over?", category: "WISH_I_KNEW", sortOrder: 3, conditionType: "SURGERY" },

  // MENTAL_HEALTH (shared — applies universally)
  { question: "How did you cope with the emotional side of recovery?", category: "MENTAL_HEALTH", sortOrder: 1, conditionType: "BOTH" },
  { question: "How did you deal with frustration during setbacks?", category: "MENTAL_HEALTH", sortOrder: 2, conditionType: "BOTH" },
  { question: "What helped you stay positive during recovery?", category: "MENTAL_HEALTH", sortOrder: 3, conditionType: "BOTH" },

  // RETURN_TO_ACTIVITY (surgery-specific)
  { question: "When did you return to your sport/activity?", category: "RETURN_TO_ACTIVITY", sortOrder: 1, conditionType: "SURGERY" },
  { question: "What was your first workout back like?", category: "RETURN_TO_ACTIVITY", sortOrder: 2, conditionType: "SURGERY" },
  { question: "How did you know you were ready to return to activity?", category: "RETURN_TO_ACTIVITY", sortOrder: 3, conditionType: "SURGERY" },

  // MISTAKES_AND_LESSONS (shared — applies universally)
  { question: "What mistakes did you make during recovery?", category: "MISTAKES_AND_LESSONS", sortOrder: 1, conditionType: "BOTH" },
  { question: "What's one thing you overdid that set you back?", category: "MISTAKES_AND_LESSONS", sortOrder: 2, conditionType: "BOTH" },

  // ─── CHRONIC PAIN PROMPTS ───

  // WEEKLY_TIMELINE (chronic pain)
  { question: "What does a typical flare day look like?", category: "WEEKLY_TIMELINE", sortOrder: 1, conditionType: "CHRONIC_PAIN" },
  { question: "How has your condition changed since diagnosis?", category: "WEEKLY_TIMELINE", sortOrder: 2, conditionType: "CHRONIC_PAIN" },
  { question: "What does a good day vs bad day look like?", category: "WEEKLY_TIMELINE", sortOrder: 3, conditionType: "CHRONIC_PAIN" },
  { question: "How did the first year after diagnosis go?", category: "WEEKLY_TIMELINE", sortOrder: 4, conditionType: "CHRONIC_PAIN" },

  // PRACTICAL_TIPS (chronic pain)
  { question: "What daily routines help you manage your pain?", category: "PRACTICAL_TIPS", sortOrder: 5, conditionType: "CHRONIC_PAIN" },
  { question: "What tools or aids help you get through the day?", category: "PRACTICAL_TIPS", sortOrder: 6, conditionType: "CHRONIC_PAIN" },
  { question: "How do you pace yourself on bad days?", category: "PRACTICAL_TIPS", sortOrder: 7, conditionType: "CHRONIC_PAIN" },

  // WISH_I_KNEW (chronic pain)
  { question: "What do you wish someone told you after your diagnosis?", category: "WISH_I_KNEW", sortOrder: 4, conditionType: "CHRONIC_PAIN" },
  { question: "What surprised you most about living with chronic pain?", category: "WISH_I_KNEW", sortOrder: 5, conditionType: "CHRONIC_PAIN" },

  // RETURN_TO_ACTIVITY (chronic pain)
  { question: "How do you stay active while managing pain?", category: "RETURN_TO_ACTIVITY", sortOrder: 4, conditionType: "CHRONIC_PAIN" },
  { question: "What modifications help you exercise safely?", category: "RETURN_TO_ACTIVITY", sortOrder: 5, conditionType: "CHRONIC_PAIN" },
  { question: "How do you know when to push through vs rest?", category: "RETURN_TO_ACTIVITY", sortOrder: 6, conditionType: "CHRONIC_PAIN" },
];

export async function POST() {
  try {
    let created = 0;

    for (const prompt of faqPrompts) {
      const prefix = prompt.conditionType === "CHRONIC_PAIN" ? "CP_" : "";
      const id = `${prefix}${prompt.category}-${prompt.sortOrder}`;
      const { error } = await supabase
        .from("FaqPrompt")
        .upsert({
          id,
          question: prompt.question,
          category: prompt.category,
          conditionType: prompt.conditionType,
          sortOrder: prompt.sortOrder,
          isActive: true,
          createdAt: new Date().toISOString(),
        }, {
          onConflict: "id",
        });

      if (error) throw error;
      created++;
    }

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error("Error seeding prompts:", error);
    return NextResponse.json(
      { error: "Failed to seed prompts", details: String(error) },
      { status: 500 }
    );
  }
}
