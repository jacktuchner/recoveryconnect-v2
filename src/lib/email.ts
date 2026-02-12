import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use Resend's test domain until peerheal.com is verified
// Change to "PeerHeal <noreply@peerheal.com>" after domain verification
const FROM_EMAIL = process.env.EMAIL_FROM || "PeerHeal <onboarding@resend.dev>";

// Email templates
function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PeerHeal</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; background: #0d9488; color: white; font-weight: bold; padding: 10px 15px; border-radius: 8px; font-size: 18px;">
      Peer<span style="color: #a5f3fc;">Heal</span>
    </div>
  </div>
  ${content}
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
    <p>PeerHeal - Peer support for your recovery journey</p>
    <p style="font-size: 12px;">This email was sent by PeerHeal. If you didn't expect this email, you can ignore it.</p>
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
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">Welcome to PeerHeal, ${name}!</h1>
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
    <p>Best,<br>The PeerHeal Team</p>
  `;

  try {
    console.log("[EMAIL] Attempting to send from:", FROM_EMAIL);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to PeerHeal, ${name}!`,
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

// Password reset email
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">Reset Your Password</h1>
    <p>We received a request to reset your password for your PeerHeal account.</p>
    <p>Click the button below to create a new password. This link will expire in 1 hour.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Reset Password
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <span style="word-break: break-all;">${resetUrl}</span>
    </p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Reset your PeerHeal password",
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error };
  }
}

// Subscription confirmed
export async function sendSubscriptionConfirmationEmail(to: string, name: string, plan: string) {
  const planLabel = plan === "annual" ? "Annual" : "Monthly";

  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">Welcome to PeerHeal!</h1>
    <p>Hi ${name},</p>
    <p>Your <strong>${planLabel}</strong> subscription is now active. You have unlimited access to all recovery recordings on PeerHeal.</p>
    <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Plan:</strong> ${planLabel}</p>
      <p style="margin: 0;"><strong>Access:</strong> Unlimited recordings</p>
    </div>
    <p>Start exploring recovery stories from people who&apos;ve been through your exact surgery.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/watch"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Browse Recordings
      </a>
    </div>
    <p>You can manage your subscription anytime from your dashboard.</p>
    <p>Best,<br>The PeerHeal Team</p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your PeerHeal subscription is active!`,
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send subscription confirmation email:", error);
    return { success: false, error };
  }
}

// Subscription cancelled
export async function sendSubscriptionCancelledEmail(to: string, name: string, accessEndsDate: string) {
  const content = `
    <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 20px;">Subscription Cancelled</h1>
    <p>Hi ${name},</p>
    <p>Your PeerHeal subscription has been cancelled.</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Access until:</strong> ${accessEndsDate}</p>
    </div>
    <p>You&apos;ll continue to have unlimited recording access until your current billing period ends. After that, you can still purchase individual recordings.</p>
    <p>Changed your mind? You can resubscribe anytime from your dashboard.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/patient"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Go to Dashboard
      </a>
    </div>
    <p>We hope to see you back soon.</p>
    <p>Best,<br>The PeerHeal Team</p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Your PeerHeal subscription has been cancelled",
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send subscription cancelled email:", error);
    return { success: false, error };
  }
}

// Group session signup confirmation
export async function sendGroupSessionSignupEmail(
  to: string,
  name: string,
  sessionTitle: string,
  date: Date,
  videoLink?: string
) {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">You're Signed Up!</h1>
    <p>Hi ${name},</p>
    <p>You've registered for the group session <strong>${sessionTitle}</strong>.</p>
    <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${dateStr}</p>
      <p style="margin: 0;"><strong>Time:</strong> ${timeStr}</p>
    </div>
    <p style="color: #6b7280;">We'll send you a confirmation with the video link once enough participants have signed up (minimum of 3 needed).</p>
    ${videoLink ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${videoLink}" style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Join Session
      </a>
    </div>
    ` : `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/patient" style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        View Your Dashboard
      </a>
    </div>
    `}
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You're signed up for: ${sessionTitle}`,
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send group session signup email:", error);
    return { success: false, error };
  }
}

// Group session confirmed (minimum met, video link available)
export async function sendGroupSessionConfirmedEmail(
  to: string,
  name: string,
  sessionTitle: string,
  date: Date,
  videoLink: string
) {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">Group Session Confirmed!</h1>
    <p>Hi ${name},</p>
    <p>Great news! <strong>${sessionTitle}</strong> has reached its minimum number of participants and is confirmed.</p>
    <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${dateStr}</p>
      <p style="margin: 0;"><strong>Time:</strong> ${timeStr}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${videoLink}" style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Join Session
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">The link will be active 15 minutes before the session starts.</p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Confirmed: ${sessionTitle}`,
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send group session confirmed email:", error);
    return { success: false, error };
  }
}

// Group session cancelled
export async function sendGroupSessionCancelledEmail(
  to: string,
  name: string,
  sessionTitle: string,
  reason: string
) {
  const content = `
    <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 20px;">Group Session Cancelled</h1>
    <p>Hi ${name},</p>
    <p>Unfortunately, <strong>${sessionTitle}</strong> has been cancelled.</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
    </div>
    ${reason.includes("minimum") ? `<p>If you paid for this session, a full refund will be processed automatically.</p>` : ""}
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/group-sessions" style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Browse Other Sessions
      </a>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Cancelled: ${sessionTitle}`,
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send group session cancelled email:", error);
    return { success: false, error };
  }
}

// Group session reminder
export async function sendGroupSessionReminderEmail(
  to: string,
  name: string,
  sessionTitle: string,
  date: Date,
  videoLink: string,
  reminderType: "day" | "hour"
) {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const timeUntil = reminderType === "day" ? "tomorrow" : "in 1 hour";

  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">Session Reminder</h1>
    <p>Hi ${name},</p>
    <p>Your group session <strong>${sessionTitle}</strong> is ${timeUntil}.</p>
    <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${dateStr}</p>
      <p style="margin: 0;"><strong>Time:</strong> ${timeStr}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${videoLink}" style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Join Session
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">Make sure to test your camera and microphone beforehand.</p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Reminder: ${sessionTitle} ${timeUntil}`,
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send group session reminder email:", error);
    return { success: false, error };
  }
}

// New message notification
export async function sendNewMessageEmail(
  to: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
) {
  const preview = messagePreview.length > 100 ? messagePreview.slice(0, 100) + "..." : messagePreview;

  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">New Message</h1>
    <p>Hi ${recipientName},</p>
    <p><strong>${senderName}</strong> sent you a message:</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; color: #6b7280; font-style: italic;">&ldquo;${preview}&rdquo;</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/messages/${conversationId}"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Reply
      </a>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New message from ${senderName}`,
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send new message email:", error);
    return { success: false, error };
  }
}

// New contributor application submitted - sent to admin
export async function sendApplicationReceivedEmail(
  adminEmail: string,
  adminName: string,
  applicantName: string,
  applicantEmail: string
) {
  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">New Contributor Application</h1>
    <p>Hi ${adminName},</p>
    <p><strong>${applicantName}</strong> (${applicantEmail}) has submitted a contributor application and is waiting for review.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/applications"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Review Applications
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">Please review and schedule a Zoom call with the applicant.</p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `New contributor application from ${applicantName}`,
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send application received email:", error);
    return { success: false, error };
  }
}

// Contributor application approved - sent to applicant
export async function sendApplicationApprovedEmail(to: string, name: string) {
  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">You're Approved!</h1>
    <p>Hi ${name},</p>
    <p>Great news! Your contributor application has been approved. You now have full access to share your recovery experience on PeerHeal.</p>
    <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>What you can do now:</strong></p>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Record and publish recovery stories</li>
        <li>Set up your availability for mentoring calls</li>
        <li>Connect your Stripe account for payouts</li>
        <li>Create group sessions</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contributor"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Go to Contributor Dashboard
      </a>
    </div>
    <p>Thank you for being part of our community and helping others through their recovery.</p>
    <p>Best,<br>The PeerHeal Team</p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Your PeerHeal contributor application is approved!",
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send application approved email:", error);
    return { success: false, error };
  }
}

// Contributor application rejected - sent to applicant
export async function sendApplicationRejectedEmail(to: string, name: string) {
  const content = `
    <h1 style="color: #374151; font-size: 24px; margin-bottom: 20px;">Application Update</h1>
    <p>Hi ${name},</p>
    <p>Thank you for your interest in becoming a contributor on PeerHeal. After reviewing your application, we're unable to approve it at this time.</p>
    <p>This doesn't reflect on your recovery experience — we may need additional information or documentation. You're welcome to reapply in the future.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/patient"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Go to Dashboard
      </a>
    </div>
    <p>If you have any questions, feel free to reach out.</p>
    <p>Best,<br>The PeerHeal Team</p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Update on your PeerHeal contributor application",
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send application rejected email:", error);
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
