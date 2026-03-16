import { Resend } from "resend";
import { BASE_URL } from "@/lib/constants";

const SITE_DOMAIN = new URL(BASE_URL).hostname;

export async function sendPasswordResetEmail(email: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping password reset email");
    return;
  }

  const resend = new Resend(apiKey);
  const resetUrl = `${BASE_URL}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  await resend.emails.send({
    from: `Napa Sonoma Guide <noreply@${SITE_DOMAIN}>`,
    to: email,
    subject: "Reset your password",
    html: `
      <h2>Reset your password</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}

export async function sendGuideEmail(email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping guide email");
    return;
  }

  const resend = new Resend(apiKey);
  const downloadUrl = `${BASE_URL}/api/guide/download`;

  await resend.emails.send({
    from: `Napa Sonoma Guide <noreply@${SITE_DOMAIN}>`,
    to: email,
    subject: "Your Free Wine Country Planning Guide",
    html: `
      <h2>Welcome to Napa Sonoma Guide!</h2>
      <p>Thanks for signing up! Your free Wine Country Planning Guide is ready.</p>
      <p>Inside you'll find tips on the best wineries, when to visit, and how to save on tastings.</p>
      <p><a href="${downloadUrl}" style="display:inline-block;padding:12px 24px;background-color:#7f1d1d;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Download Your Free Guide (PDF)</a></p>
      <p>Happy wine tasting!</p>
    `,
  });
}

export async function notifyNewSubscriber(email: string, source: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping subscriber notification");
    return;
  }

  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: `Napa Sonoma Guide <noreply@${SITE_DOMAIN}>`,
    to: "theinterchangestudio@gmail.com",
    subject: "New subscriber",
    html: `<p>New subscriber: ${email} (source: ${source})</p>`,
  });
}
