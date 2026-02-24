import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "Kizu <support@thekizu.com>";

// Email templates
function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kizu</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; background: #0d9488; color: white; font-weight: bold; padding: 10px 15px; border-radius: 8px; font-size: 18px;">
      Kizu
    </div>
  </div>
  ${content}
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
    <p>Kizu - Peer support for your recovery journey</p>
    <p style="font-size: 12px;">This email was sent by Kizu. If you didn't expect this email, you can ignore it.</p>
  </div>
</body>
</html>
  `.trim();
}

// Welcome email for new users
export async function sendWelcomeEmail(to: string, name: string, role: string) {
  console.log("[EMAIL] Sending welcome email to:", to, "with API key:", process.env.RESEND_API_KEY ? "SET" : "MISSING");
  const isGuide = role === "GUIDE";

  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">Welcome to Kizu, ${name}!</h1>
    <p>Thank you for joining our community. ${
      isGuide
        ? "We're excited to have you share your recovery experience with others."
        : "We're here to help connect you with people who understand your recovery journey."
    }</p>
    <p><strong>What's next?</strong></p>
    <ul style="padding-left: 20px;">
      ${
        isGuide
          ? `
        <li>Complete your guide profile</li>
        <li>Record your first recovery story</li>
        <li>Set up your availability for calls</li>
        <li>Connect your Stripe account for payouts</li>
      `
          : `
        <li>Complete your recovery profile to get better matches</li>
        <li>Browse recovery stories from people like you</li>
        <li>Book a call with a guide who's been there</li>
      `
      }
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${isGuide ? "guide" : "seeker"}"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Go to Your Dashboard
      </a>
    </div>
    <p>If you have any questions, we're here to help.</p>
    <p>Best,<br>The Kizu Team</p>
  `;

  try {
    console.log("[EMAIL] Attempting to send from:", FROM_EMAIL);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to Kizu, ${name}!`,
      html: baseTemplate(content),
    });
    console.log("[EMAIL] Send result:", result);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send welcome email:", error);
    return { success: false, error };
  }
}

// Call confirmed - sent to both guide and seeker (auto-confirmed on payment)
export async function sendCallBookedEmail(
  recipientEmail: string,
  recipientName: string,
  otherPartyName: string,
  scheduledAt: Date,
  durationMinutes: number,
  questions?: string,
  videoRoomUrl?: string | null,
  isSeeker: boolean = false
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

  const heading = isSeeker ? "Your Call is Confirmed!" : "New Call Scheduled!";
  const intro = isSeeker
    ? `Your call with <strong>${otherPartyName}</strong> is confirmed.`
    : `<strong>${otherPartyName}</strong> has booked a call with you.`;
  const dashboardUrl = isSeeker
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/seeker`
    : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/guide`;

  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">${heading}</h1>
    <p>Hi ${recipientName},</p>
    <p>${intro}</p>
    <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${dateStr}</p>
      <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${timeStr}</p>
      <p style="margin: 0;"><strong>Duration:</strong> ${durationMinutes} minutes</p>
    </div>
    ${
      questions
        ? `
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: 600;">Questions from ${otherPartyName}:</p>
        <p style="margin: 0; color: #6b7280; font-style: italic;">&ldquo;${questions}&rdquo;</p>
      </div>
    `
        : ""
    }
    ${
      videoRoomUrl
        ? `
      <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 15px 0; font-weight: 600; color: #059669;">Join your video call here:</p>
        <a href="${videoRoomUrl}"
           style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Join Video Call
        </a>
        <p style="margin: 15px 0 0 0; font-size: 12px; color: #6b7280;">
          This link will be active starting 15 minutes before your scheduled time.
        </p>
      </div>
    `
        : ""
    }
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        View Call Details
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">Cancellations made less than 24 hours before the call are non-refundable. We&apos;ll send you a reminder before your call.</p>
  `;

  try {
    const subject = isSeeker
      ? `Call confirmed with ${otherPartyName}${videoRoomUrl ? " - Video link inside" : ""}`
      : `New call scheduled with ${otherPartyName}`;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send call booked email:", error);
    return { success: false, error };
  }
}

// Call cancelled - sent to both parties
export async function sendCallCancelledEmail(
  recipientEmail: string,
  recipientName: string,
  cancelledByName: string,
  scheduledAt: Date,
  wasGuideCancelling: boolean,
  refundIssued: boolean = false
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

  const refundNote = refundIssued
    ? `<p style="color: #059669; font-weight: 600;">A full refund has been issued and will appear on your statement shortly.</p>`
    : `<p style="color: #991b1b; font-weight: 600;">This cancellation was made less than 24 hours before the call, so no refund will be issued.</p>`;

  const content = `
    <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 20px;">Call Cancelled</h1>
    <p>Hi ${recipientName},</p>
    <p>${cancelledByName === "You" ? "You have" : `<strong>${cancelledByName}</strong> has`} cancelled the call that was scheduled for:</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${dateStr}</p>
      <p style="margin: 0;"><strong>Time:</strong> ${timeStr}</p>
    </div>
    ${refundNote}
    ${
      wasGuideCancelling
        ? `
      <p>There are other guides available who can help you on your recovery journey.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/guides"
           style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
          Find Another Guide
        </a>
      </div>
    `
        : `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/guide"
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
      subject: `Call cancelled - ${dateStr}`,
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
    <p>We received a request to reset your password for your Kizu account.</p>
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
      subject: "Reset your Kizu password",
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
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
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/seeker" style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
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

// Password changed confirmation
export async function sendPasswordChangedEmail(to: string, name: string) {
  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">Password Changed</h1>
    <p>Hi ${name},</p>
    <p>Your Kizu account password was just changed successfully.</p>
    <p>If you made this change, no further action is needed.</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; color: #991b1b;"><strong>Didn't change your password?</strong> If you didn't make this change, please reset your password immediately and contact support.</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/forgot-password"
         style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Reset Password
      </a>
    </div>
    <p>Best,<br>The Kizu Team</p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Your Kizu password was changed",
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send password changed email:", error);
    return { success: false, error };
  }
}

// New guide application submitted - sent to admin
export async function sendApplicationReceivedEmail(
  adminEmail: string,
  adminName: string,
  applicantName: string,
  applicantEmail: string
) {
  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">New Guide Application</h1>
    <p>Hi ${adminName},</p>
    <p><strong>${applicantName}</strong> (${applicantEmail}) has submitted a guide application and is waiting for review.</p>
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
      subject: `New guide application from ${applicantName}`,
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send application received email:", error);
    return { success: false, error };
  }
}

// Guide application submitted - confirmation sent to applicant
export async function sendApplicationSubmittedEmail(to: string, name: string) {
  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">Application Received!</h1>
    <p>Hi ${name},</p>
    <p>Thank you for applying to become a guide on Kizu. We've received your application and our team will review it shortly.</p>
    <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>What happens next:</strong></p>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Our team will review your application</li>
        <li>We may reach out to schedule a brief call</li>
        <li>You'll receive an email once a decision is made</li>
      </ul>
    </div>
    <p>In the meantime, you can continue using Kizu as a seeker.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/seeker"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Go to Dashboard
      </a>
    </div>
    <p>Best,<br>The Kizu Team</p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "We received your Kizu guide application!",
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send application submitted email:", error);
    return { success: false, error };
  }
}

// Guide application approved - sent to applicant
export async function sendApplicationApprovedEmail(to: string, name: string) {
  const content = `
    <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">You're Approved!</h1>
    <p>Hi ${name},</p>
    <p>Great news! Your guide application has been approved. You now have full access to share your recovery experience on Kizu.</p>
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
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/guide"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Go to Guide Dashboard
      </a>
    </div>
    <p>Thank you for being part of our community and helping others through their recovery.</p>
    <p>Best,<br>The Kizu Team</p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Your Kizu guide application is approved!",
      html: baseTemplate(content),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send application approved email:", error);
    return { success: false, error };
  }
}

// Guide application rejected - sent to applicant
export async function sendApplicationRejectedEmail(to: string, name: string) {
  const content = `
    <h1 style="color: #374151; font-size: 24px; margin-bottom: 20px;">Application Update</h1>
    <p>Hi ${name},</p>
    <p>Thank you for your interest in becoming a guide on Kizu. After reviewing your application, we're unable to approve it at this time.</p>
    <p>This doesn't reflect on your recovery experience — we may need additional information or documentation. You're welcome to reapply in the future.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/seeker"
         style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Go to Dashboard
      </a>
    </div>
    <p>If you have any questions, feel free to reach out.</p>
    <p>Best,<br>The Kizu Team</p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Update on your Kizu guide application",
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
  isGuide: boolean,
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
      ${isGuide ? "<li>Review any questions submitted in advance</li>" : "<li>Have your questions ready</li>"}
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${isGuide ? "guide" : "seeker"}"
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
