import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { createRoom } from "@/lib/daily";
import { v4 as uuidv4 } from "uuid";
import {
  sendGroupSessionConfirmedEmail,
  sendGroupSessionCancelledEmail,
  sendGroupSessionReminderEmail,
} from "@/lib/email";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    minimumChecks: { confirmed: 0, cancelled: 0, errors: [] as string[] },
    reminders: { day: 0, hour: 0, errors: [] as string[] },
    completed: { count: 0, errors: [] as string[] },
  };

  try {
    await runMinimumCheck(results.minimumChecks);
    await runReminders(results.reminders);
    await runAutoComplete(results.completed);
  } catch (error) {
    console.error("Group session lifecycle cron error:", error);
  }

  return NextResponse.json({
    success: true,
    ...results,
    timestamp: new Date().toISOString(),
  });
}

async function runMinimumCheck(results: { confirmed: number; cancelled: number; errors: string[] }) {
  const now = new Date();
  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  // Find SCHEDULED sessions between 3-4 hours from now that haven't been checked
  const { data: sessions, error } = await supabase
    .from("GroupSession")
    .select("*")
    .eq("status", "SCHEDULED")
    .is("minimumCheckAt", null)
    .lte("scheduledAt", fourHoursFromNow.toISOString())
    .gte("scheduledAt", threeHoursFromNow.toISOString());

  if (error) {
    results.errors.push(`Fetch error: ${error.message}`);
    return;
  }

  for (const session of sessions || []) {
    try {
      const { count } = await supabase
        .from("GroupSessionParticipant")
        .select("id", { count: "exact", head: true })
        .eq("groupSessionId", session.id)
        .eq("status", "REGISTERED");

      const participantCount = count || 0;

      if (participantCount >= session.minAttendees) {
        // CONFIRM: create Daily.co room and notify everyone
        const videoRoomUrl = await createRoom({
          callId: `group-${session.id}`,
          expiresInMinutes: session.durationMinutes + 60,
          maxParticipants: session.maxCapacity + 1,
        });

        await supabase
          .from("GroupSession")
          .update({
            status: "CONFIRMED",
            videoRoomUrl,
            minimumCheckAt: now.toISOString(),
            updatedAt: now.toISOString(),
          })
          .eq("id", session.id);

        // Email all participants + contributor
        const { data: participants } = await supabase
          .from("GroupSessionParticipant")
          .select("userId, user:User!GroupSessionParticipant_userId_fkey(email, name)")
          .eq("groupSessionId", session.id)
          .eq("status", "REGISTERED");

        for (const p of participants || []) {
          if ((p.user as any)?.email) {
            await sendGroupSessionConfirmedEmail(
              (p.user as any).email,
              (p.user as any).name || "there",
              session.title,
              new Date(session.scheduledAt),
              videoRoomUrl
            );
          }
        }

        // Email contributor too
        const { data: contributor } = await supabase
          .from("User")
          .select("email, name")
          .eq("id", session.contributorId)
          .single();

        if (contributor?.email) {
          await sendGroupSessionConfirmedEmail(
            contributor.email,
            contributor.name || "there",
            session.title,
            new Date(session.scheduledAt),
            videoRoomUrl
          );
        }

        results.confirmed++;
      } else {
        // CANCEL: refund all paid participants and notify everyone
        await supabase
          .from("GroupSession")
          .update({
            status: "CANCELLED",
            minimumCheckAt: now.toISOString(),
            updatedAt: now.toISOString(),
          })
          .eq("id", session.id);

        const { data: participants } = await supabase
          .from("GroupSessionParticipant")
          .select("*, user:User!GroupSessionParticipant_userId_fkey(email, name)")
          .eq("groupSessionId", session.id)
          .eq("status", "REGISTERED");

        for (const p of participants || []) {
          // Refund paid participants
          if (p.pricePaid > 0 && p.stripeSessionId) {
            try {
              const checkoutSession = await stripe.checkout.sessions.retrieve(p.stripeSessionId);
              if (checkoutSession.payment_intent) {
                await stripe.refunds.create({
                  payment_intent: checkoutSession.payment_intent as string,
                });
              }
              if (p.paymentId) {
                await supabase.from("Payment").update({ status: "REFUNDED" }).eq("id", p.paymentId);
              }
              await supabase.from("GroupSessionParticipant").update({ status: "REFUNDED" }).eq("id", p.id);
            } catch (refundError) {
              console.error(`Error refunding participant ${p.userId}:`, refundError);
              results.errors.push(`Refund error for ${p.userId}: ${refundError}`);
            }
          } else {
            await supabase.from("GroupSessionParticipant").update({ status: "CANCELLED" }).eq("id", p.id);
          }

          // Send cancellation email
          if ((p.user as any)?.email) {
            await sendGroupSessionCancelledEmail(
              (p.user as any).email,
              (p.user as any).name || "there",
              session.title,
              "The minimum number of participants was not met"
            );
          }
        }

        // Notify contributor
        const { data: contributor } = await supabase
          .from("User")
          .select("email, name")
          .eq("id", session.contributorId)
          .single();

        if (contributor?.email) {
          await sendGroupSessionCancelledEmail(
            contributor.email,
            contributor.name || "there",
            session.title,
            "The minimum number of participants was not met"
          );
        }

        results.cancelled++;
      }
    } catch (err) {
      console.error(`Error processing session ${session.id}:`, err);
      results.errors.push(`Session ${session.id}: ${err}`);
    }
  }
}

async function runReminders(results: { day: number; hour: number; errors: string[] }) {
  const now = new Date();

  // Day-before reminders (23-25 hours before)
  const dayBefore = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayBeforeWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const { data: dayReminders } = await supabase
    .from("GroupSession")
    .select("*")
    .eq("status", "CONFIRMED")
    .is("dayReminderSent", null)
    .lte("scheduledAt", dayBeforeWindow.toISOString())
    .gte("scheduledAt", dayBefore.toISOString());

  for (const session of dayReminders || []) {
    try {
      const { data: participants } = await supabase
        .from("GroupSessionParticipant")
        .select("userId, user:User!GroupSessionParticipant_userId_fkey(email, name)")
        .eq("groupSessionId", session.id)
        .eq("status", "REGISTERED");

      for (const p of participants || []) {
        if ((p.user as any)?.email && session.videoRoomUrl) {
          await sendGroupSessionReminderEmail(
            (p.user as any).email,
            (p.user as any).name || "there",
            session.title,
            new Date(session.scheduledAt),
            session.videoRoomUrl,
            "day"
          );
        }
      }

      // Send to contributor too
      const { data: contributor } = await supabase
        .from("User")
        .select("email, name")
        .eq("id", session.contributorId)
        .single();

      if (contributor?.email && session.videoRoomUrl) {
        await sendGroupSessionReminderEmail(
          contributor.email,
          contributor.name || "there",
          session.title,
          new Date(session.scheduledAt),
          session.videoRoomUrl,
          "day"
        );
      }

      await supabase
        .from("GroupSession")
        .update({ dayReminderSent: now.toISOString() })
        .eq("id", session.id);

      results.day++;
    } catch (err) {
      results.errors.push(`Day reminder for ${session.id}: ${err}`);
    }
  }

  // Hour-before reminders (45-75 minutes before)
  const hourBefore = new Date(now.getTime() + 45 * 60 * 1000);
  const hourBeforeWindow = new Date(now.getTime() + 75 * 60 * 1000);

  const { data: hourReminders } = await supabase
    .from("GroupSession")
    .select("*")
    .eq("status", "CONFIRMED")
    .is("hourReminderSent", null)
    .lte("scheduledAt", hourBeforeWindow.toISOString())
    .gte("scheduledAt", hourBefore.toISOString());

  for (const session of hourReminders || []) {
    try {
      const { data: participants } = await supabase
        .from("GroupSessionParticipant")
        .select("userId, user:User!GroupSessionParticipant_userId_fkey(email, name)")
        .eq("groupSessionId", session.id)
        .eq("status", "REGISTERED");

      for (const p of participants || []) {
        if ((p.user as any)?.email && session.videoRoomUrl) {
          await sendGroupSessionReminderEmail(
            (p.user as any).email,
            (p.user as any).name || "there",
            session.title,
            new Date(session.scheduledAt),
            session.videoRoomUrl,
            "hour"
          );
        }
      }

      const { data: contributor } = await supabase
        .from("User")
        .select("email, name")
        .eq("id", session.contributorId)
        .single();

      if (contributor?.email && session.videoRoomUrl) {
        await sendGroupSessionReminderEmail(
          contributor.email,
          contributor.name || "there",
          session.title,
          new Date(session.scheduledAt),
          session.videoRoomUrl,
          "hour"
        );
      }

      await supabase
        .from("GroupSession")
        .update({ hourReminderSent: now.toISOString() })
        .eq("id", session.id);

      results.hour++;
    } catch (err) {
      results.errors.push(`Hour reminder for ${session.id}: ${err}`);
    }
  }
}

async function runAutoComplete(results: { count: number; errors: string[] }) {
  const now = new Date();
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

  // Find CONFIRMED sessions that ended 30+ minutes ago
  const { data: sessions } = await supabase
    .from("GroupSession")
    .select("*")
    .eq("status", "CONFIRMED");

  for (const session of sessions || []) {
    const sessionEnd = new Date(
      new Date(session.scheduledAt).getTime() + session.durationMinutes * 60 * 1000
    );

    if (sessionEnd > thirtyMinAgo) continue; // Not ended yet or too recent

    try {
      // Get non-cancelled participants for payout calculation
      const { data: participants } = await supabase
        .from("GroupSessionParticipant")
        .select("pricePaid, status")
        .eq("groupSessionId", session.id)
        .in("status", ["REGISTERED", "ATTENDED"]);

      const totalRevenue = (participants || []).reduce((sum, p) => sum + p.pricePaid, 0);
      const contributorPayout = totalRevenue * 0.75;

      // Mark as completed
      await supabase
        .from("GroupSession")
        .update({
          status: "COMPLETED",
          updatedAt: now.toISOString(),
        })
        .eq("id", session.id);

      // Update participant statuses to ATTENDED
      await supabase
        .from("GroupSessionParticipant")
        .update({ status: "ATTENDED" })
        .eq("groupSessionId", session.id)
        .eq("status", "REGISTERED");

      // Create contributor payout if there's revenue
      if (contributorPayout > 0) {
        const { data: contributor } = await supabase
          .from("User")
          .select("stripeConnectId, stripeConnectOnboarded")
          .eq("id", session.contributorId)
          .single();

        if (contributor?.stripeConnectId && contributor.stripeConnectOnboarded) {
          try {
            const transfer = await stripe.transfers.create({
              amount: Math.round(contributorPayout * 100),
              currency: "usd",
              destination: contributor.stripeConnectId,
              transfer_group: `group_session_${session.id}`,
              metadata: {
                groupSessionId: session.id,
                contributorId: session.contributorId,
              },
            });

            await supabase.from("Payment").insert({
              id: uuidv4(),
              userId: session.contributorId,
              type: "GUIDE_PAYOUT",
              amount: contributorPayout,
              currency: "usd",
              status: "COMPLETED",
              stripePaymentId: transfer.id,
              metadata: {
                groupSessionId: session.id,
                transferId: transfer.id,
                totalRevenue,
                participantCount: participants?.length || 0,
              },
              createdAt: now.toISOString(),
            });
          } catch (payoutError) {
            console.error(`Error creating payout for session ${session.id}:`, payoutError);
            results.errors.push(`Payout error for ${session.id}: ${payoutError}`);
          }
        }
      }

      results.count++;
    } catch (err) {
      console.error(`Error completing session ${session.id}:`, err);
      results.errors.push(`Complete error for ${session.id}: ${err}`);
    }
  }
}
