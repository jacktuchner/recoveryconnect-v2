import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendCallReminderEmail } from "@/lib/email";

// This endpoint should be called by a cron job every 15 minutes
// It sends reminders for calls happening in ~24 hours and ~1 hour

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
      dayReminders: 0,
      hourReminders: 0,
      errors: [] as string[],
    };

    // Find calls for day-before reminders (23-25 hours from now)
    const dayReminderStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const dayReminderEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: dayBeforeCalls, error: dayError } = await supabase
      .from("Call")
      .select(
        "*, patient:User!Call_patientId_fkey(id, name, email), contributor:User!Call_contributorId_fkey(id, name, email)"
      )
      .in("status", ["CONFIRMED"])
      .gte("scheduledAt", dayReminderStart.toISOString())
      .lt("scheduledAt", dayReminderEnd.toISOString())
      .is("dayReminderSent", null); // Only if not already sent

    if (dayError) {
      console.error("Error fetching day-before calls:", dayError);
      // Field might not exist yet, try without the filter
    }

    // Find calls for hour-before reminders (55-65 minutes from now)
    const hourReminderStart = new Date(now.getTime() + 55 * 60 * 1000);
    const hourReminderEnd = new Date(now.getTime() + 65 * 60 * 1000);

    const { data: hourBeforeCalls, error: hourError } = await supabase
      .from("Call")
      .select(
        "*, patient:User!Call_patientId_fkey(id, name, email), contributor:User!Call_contributorId_fkey(id, name, email)"
      )
      .in("status", ["CONFIRMED"])
      .gte("scheduledAt", hourReminderStart.toISOString())
      .lt("scheduledAt", hourReminderEnd.toISOString())
      .is("hourReminderSent", null); // Only if not already sent

    if (hourError) {
      console.error("Error fetching hour-before calls:", hourError);
    }

    // Send day-before reminders
    if (dayBeforeCalls && dayBeforeCalls.length > 0) {
      for (const call of dayBeforeCalls) {
        try {
          // Send to patient
          if (call.patient?.email) {
            await sendCallReminderEmail(
              call.patient.email,
              call.patient.name || "Patient",
              call.contributor?.name || "Your mentor",
              new Date(call.scheduledAt),
              call.durationMinutes,
              false, // isContributor
              "day"
            );
          }

          // Send to contributor
          if (call.contributor?.email) {
            await sendCallReminderEmail(
              call.contributor.email,
              call.contributor.name || "Contributor",
              call.patient?.name || "Your patient",
              new Date(call.scheduledAt),
              call.durationMinutes,
              true, // isContributor
              "day"
            );
          }

          // Mark as sent (ignore error if column doesn't exist)
          await supabase
            .from("Call")
            .update({ dayReminderSent: new Date().toISOString() })
            .eq("id", call.id)
            .then(() => {})
            .catch(() => {});

          results.dayReminders++;
        } catch (err) {
          results.errors.push(`Day reminder failed for call ${call.id}: ${err}`);
        }
      }
    }

    // Send hour-before reminders
    if (hourBeforeCalls && hourBeforeCalls.length > 0) {
      for (const call of hourBeforeCalls) {
        try {
          // Send to patient
          if (call.patient?.email) {
            await sendCallReminderEmail(
              call.patient.email,
              call.patient.name || "Patient",
              call.contributor?.name || "Your mentor",
              new Date(call.scheduledAt),
              call.durationMinutes,
              false, // isContributor
              "hour"
            );
          }

          // Send to contributor
          if (call.contributor?.email) {
            await sendCallReminderEmail(
              call.contributor.email,
              call.contributor.name || "Contributor",
              call.patient?.name || "Your patient",
              new Date(call.scheduledAt),
              call.durationMinutes,
              true, // isContributor
              "hour"
            );
          }

          // Mark as sent (ignore error if column doesn't exist)
          await supabase
            .from("Call")
            .update({ hourReminderSent: new Date().toISOString() })
            .eq("id", call.id)
            .then(() => {})
            .catch(() => {});

          results.hourReminders++;
        } catch (err) {
          results.errors.push(`Hour reminder failed for call ${call.id}: ${err}`);
        }
      }
    }

    console.log(
      `Call reminders sent: ${results.dayReminders} day, ${results.hourReminders} hour`
    );

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error processing call reminders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
