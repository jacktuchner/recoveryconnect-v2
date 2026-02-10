import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface FaqPrompt {
  id: string;
  question: string;
  category: string;
  conditionType: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const conditionType = request.nextUrl.searchParams.get("conditionType");

    let query = supabase
      .from("FaqPrompt")
      .select("*")
      .eq("isActive", true)
      .order("category", { ascending: true })
      .order("sortOrder", { ascending: true });

    // Filter by condition type: return matching + shared ("BOTH") prompts
    if (conditionType === "CHRONIC_PAIN") {
      query = query.in("conditionType", ["CHRONIC_PAIN", "BOTH"]);
    } else if (conditionType === "SURGERY") {
      query = query.in("conditionType", ["SURGERY", "BOTH"]);
    }

    const { data: prompts, error } = await query;

    if (error) throw error;

    // Group by category
    const grouped = (prompts || []).reduce<Record<string, FaqPrompt[]>>((acc, prompt) => {
      const category = prompt.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(prompt);
      return acc;
    }, {});

    return NextResponse.json({ prompts, grouped });
  } catch (error) {
    console.error("Error fetching FAQ prompts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
