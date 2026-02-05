import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use Resend's test domain until recoveryconnect.com is verified
// Change to "RecoveryConnect <noreply@recoveryconnect.com>" after domain verification
const FROM_EMAIL = process.env.EMAIL_FROM || "RecoveryConnect <onboarding@resend.dev>";

// Email templates
function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RecoveryConnect</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; background: #0d9488; color: white; font-weight: bold; padding: 10px 15px; border-radius: 8px; font-size: 18px;">
      Recovery<span style="color: #a5f3fc;">Connect</span>
    </div>
  </div>
  ${content}
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
    <p>RecoveryConnect - Peer support for your recovery journey</p>
    <p style="font-size: 12px;">This email was sent by RecoveryConnect. If you didn't expect this email, you can ignore it.</p>
  </div>
</body>
</html>
  `.trim();
}

// Welcome email for new users
export async function sendWelcomeEmail(to: string, name: string, role: string) {
  console.log("[EMAIL] Sending welcome email to:", to, "with API key:", process.env.RESEND_API_KEY ? "SET" : "MISSING");
  const isContributor = role === "CONTRIBUTOR";

  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">Welcome to RecoveryConnect, ${name}!</h1>
    <p>Thank you for joining our community. ${
      isContributor
        ? "We're excited to have you share your recovery experience with others."
        : "We're here to help connect you with people who understand your recovery journey."
    }</p>
    <p><strong>What's next?</strong></p>
    <ul style="padding-left: 20px;">
      ${
        isContributor
          ? `
        <li>Complete your contributor profile</li>
        <li>Record your first recovery story</li>
        <li>Set up your availability for calls</li>
        <li>Connect your Stripe account for payouts</li>
      `
          : `
        <li>Complete your recovery profile to get better matches</li>
        <li>Browse recovery stories from people like you</li>
        <li>Book a call with a mentor who's been there</li>
      `
      }
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${isContributor ? "contributor" : "patient"}"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Go to Your Dashboard
      </a>
    </div>
    <p>If you have any questions, we're here to help.</p>
    <p>Best,<br>The RecoveryConnect Team</p>
  `;

  try {
    console.log("[EMAIL] Attempting to send from:", FROM_EMAIL);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to RecoveryConnect, ${name}!`,
      html: baseTemplate(content),
    });
    console.log("[EMAIL] Send result:", result);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send welcome email:", error);
    return { success: false, error };
  }
}

// Call booked - sent to contributor
export async function sendCallBookedEmail(
  contributorEmail: string,
  contributorName: string,
  patientName: string,
  scheduledAt: Date,
  durationMinutes: number,
  questions?: string
) {
  const dateStr = scheduledAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = scheduledAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">New Call Request!</h1>
    <p>Hi ${contributorName},</p>
    <p><strong>${patientName}</strong> has requested a call with you.</p>
    <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${dateStr}</p>
      <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${timeStr}</p>
      <p style="margin: 0;"><strong>Duration:</strong> ${durationMinutes} minutes</p>
    </div>
    ${
      questions
        ? `
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: 600;">Questions from ${patientName}:</p>
        <p style="margin: 0; color: #6b7280; font-style: italic;">"${questions}"</p>
      </div>
    `
        : ""
    }
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contributor"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Confirm or Decline
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">Please respond to this request as soon as possible.</p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: contributorEmail,
      subject: `New call request from ${patientName}`,
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send call booked email:", error);
    return { success: false, error };
  }
}

// Call confirmed - sent to patient
export async function sendCallConfirmedEmail(
  patientEmail: string,
  patientName: string,
  contributorName: string,
  scheduledAt: Date,
  durationMinutes: number
) {
  const dateStr = scheduledAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = scheduledAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">Your Call is Confirmed!</h1>
    <p>Hi ${patientName},</p>
    <p>Great news! <strong>${contributorName}</strong> has confirmed your call.</p>
    <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${dateStr}</p>
      <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${timeStr}</p>
      <p style="margin: 0;"><strong>Duration:</strong> ${durationMinutes} minutes</p>
    </div>
    <p><strong>Tips for your call:</strong></p>
    <ul style="padding-left: 20px; color: #6b7280;">
      <li>Find a quiet, private space</li>
      <li>Have your questions ready</li>
      <li>Test your camera and microphone beforehand</li>
      <li>Remember: this is peer support, not medical advice</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/patient"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        View Your Calls
      </a>
    </div>
    <p>We'll send you a reminder before your call.</p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: patientEmail,
      subject: `Call confirmed with ${contributorName}`,
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send call confirmed email:", error);
    return { success: false, error };
  }
}

// Call cancelled - sent to the other party
export async function sendCallCancelledEmail(
  recipientEmail: string,
  recipientName: string,
  cancelledByName: string,
  scheduledAt: Date,
  wasContributorCancelling: boolean
) {
  const dateStr = scheduledAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = scheduledAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const content = `
    <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 20px;">Call Cancelled</h1>
    <p>Hi ${recipientName},</p>
    <p>Unfortunately, <strong>${cancelledByName}</strong> has cancelled the call that was scheduled for:</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${dateStr}</p>
      <p style="margin: 0;"><strong>Time:</strong> ${timeStr}</p>
    </div>
    ${
      wasContributorCancelling
        ? `
      <p>Don't worry - there are other mentors available who can help you on your recovery journey.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/mentors"
           style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
          Find Another Mentor
        </a>
      </div>
    `
        : `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contributor"
           style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
          View Your Dashboard
        </a>
      </div>
    `
    }
    <p>If you have any questions, please reach out.</p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `Call cancelled by ${cancelledByName}`,
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send call cancelled email:", error);
    return { success: false, error };
  }
}

// Call reminder - sent to both parties (1 day before and 1 hour before)
export async function sendCallReminderEmail(
  recipientEmail: string,
  recipientName: string,
  otherPartyName: string,
  scheduledAt: Date,
  durationMinutes: number,
  isContributor: boolean,
  reminderType: "day" | "hour"
) {
  const dateStr = scheduledAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = scheduledAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const timeUntil = reminderType === "day" ? "tomorrow" : "in 1 hour";

  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">Call Reminder</h1>
    <p>Hi ${recipientName},</p>
    <p>Just a reminder that your call with <strong>${otherPartyName}</strong> is ${timeUntil}.</p>
    <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${dateStr}</p>
      <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${timeStr}</p>
      <p style="margin: 0;"><strong>Duration:</strong> ${durationMinutes} minutes</p>
    </div>
    <p><strong>Quick checklist:</strong></p>
    <ul style="padding-left: 20px; color: #6b7280;">
      <li>Find a quiet, private space</li>
      <li>Test your camera and microphone</li>
      <li>Have a stable internet connection</li>
      ${isContributor ? "<li>Review any questions submitted in advance</li>" : "<li>Have your questions ready</li>"}
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${isContributor ? "contributor" : "patient"}"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        View Call Details
      </a>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `Reminder: Call with ${otherPartyName} ${timeUntil}`,
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send call reminder email:", error);
    return { success: false, error };
  }
}
