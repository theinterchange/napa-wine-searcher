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
