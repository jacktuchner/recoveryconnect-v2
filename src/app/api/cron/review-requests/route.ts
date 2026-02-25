import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendReviewRequestEmail } from "@/lib/email";

// This endpoint should be called by a cron job every 30 minutes
// It sends review request emails for calls completed 3-5 hours ago

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const results = {
      sent: 0,
      errors: [] as string[],
    };

    // Find calls completed 3-5 hours ago that haven't had a review request sent
    const windowStart = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const { data: completedCalls, error: fetchError } = await supabase
      .from("Call")
      .select(
        "id, contributorId, patientId, scheduledAt, updatedAt, seeker:User!Call_patientId_fkey(id, name, email), guide:User!Call_contributorId_fkey(id, name, email)"
      )
      .eq("status", "COMPLETED")
      .is("reviewRequestSent", null)
      .gte("updatedAt", windowStart.toISOString())
      .lt("updatedAt", windowEnd.toISOString());

    if (fetchError) {
      console.error("Error fetching completed calls:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch completed calls" },
        { status: 500 }
      );
    }

    if (!completedCalls || completedCalls.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "No calls to send review requests for",
        timestamp: now.toISOString(),
      });
    }

    for (const call of completedCalls) {
      try {
        const seeker = call.seeker as any;
        const guide = call.guide as any;

        // Check if a review already exists for this call from the seeker
        const { data: existingReview } = await supabase
          .from("Review")
          .select("id")
          .eq("callId", call.id)
          .eq("authorId", call.patientId)
          .maybeSingle();

        if (existingReview) {
          // Already reviewed, mark as sent to skip in future
          await supabase
            .from("Call")
            .update({ reviewRequestSent: new Date().toISOString() })
            .eq("id", call.id);
          continue;
        }

        // Send review request email to seeker
        if (seeker?.email && guide) {
          await sendReviewRequestEmail(
            seeker.email,
            seeker.name || "Seeker",
            guide.name || "your guide",
            new Date(call.scheduledAt),
            call.contributorId,
            call.id
          );

          // Mark as sent for idempotency
          await supabase
            .from("Call")
            .update({ reviewRequestSent: new Date().toISOString() })
            .eq("id", call.id);

          results.sent++;
        }
      } catch (err) {
        results.errors.push(
          `Review request failed for call ${call.id}: ${err}`
        );
      }
    }

    console.log(`Review requests sent: ${results.sent}`);

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error processing review requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
