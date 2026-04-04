import { Resend } from "resend";
import { BASE_URL } from "@/lib/constants";
import { wineSearchUrl } from "@/lib/affiliate";

const SITE_DOMAIN = new URL(BASE_URL).hostname.replace(/^www\./, "");

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

  const { error } = await resend.emails.send({
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
  if (error) {
    console.error(`Resend error sending guide email: ${error.message}`);
  }
}

interface RecapWine {
  wineName: string;
  wineryName: string | null;
  vintage: number | null;
  rating: number | null;
  tastingNotes: string | null;
  dateTried: string;
}

interface TripRecapData {
  tripName: string;
  wineries: Array<{
    name: string;
    slug: string | null;
    websiteUrl: string | null;
    wines: RecapWine[];
  }>;
}

export async function sendTripRecapEmail(email: string, data: TripRecapData) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping trip recap email");
    return;
  }

  const stars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (i < rating ? "★" : "☆")).join("");

  let winerySections = "";
  let totalWines = 0;

  for (const winery of data.wineries) {
    const wineryLink = winery.slug
      ? `<a href="${BASE_URL}/wineries/${winery.slug}" style="color:#7f1d1d;text-decoration:none;font-weight:600;font-size:18px;">${winery.name}</a>`
      : `<span style="font-weight:600;font-size:18px;">${winery.name}</span>`;

    const bookLink = winery.websiteUrl
      ? `<a href="${winery.websiteUrl}?utm_source=napasonoma&utm_medium=email&utm_campaign=trip_recap" style="color:#7f1d1d;text-decoration:none;font-size:13px;">Book another visit →</a>`
      : "";

    let wineRows = "";
    if (winery.wines.length > 0) {
      totalWines += winery.wines.length;
      for (const wine of winery.wines) {
        const ratingHtml = wine.rating
          ? `<span style="color:#b45309;">${stars(wine.rating)}</span>`
          : "";
        const vintageHtml = wine.vintage ? ` (${wine.vintage})` : "";
        const notesHtml = wine.tastingNotes
          ? `<p style="margin:4px 0 0;color:#6b7280;font-size:13px;font-style:italic;">${wine.tastingNotes}</p>`
          : "";
        const searchUrl = wineSearchUrl(winery.name, wine.wineName, wine.vintage);
        const findLink = searchUrl
          ? `<a href="${searchUrl}" style="color:#9ca3af;text-decoration:none;font-size:12px;">Find this wine online →</a>`
          : "";

        wineRows += `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
              <div style="font-weight:500;">${wine.wineName}${vintageHtml}</div>
              ${ratingHtml}
              ${notesHtml}
              ${findLink ? `<div style="margin-top:4px;">${findLink}</div>` : ""}
            </td>
          </tr>`;
      }
    } else {
      wineRows = `
        <tr>
          <td style="padding:8px 0;color:#9ca3af;font-size:13px;font-style:italic;">
            No wines logged yet
          </td>
        </tr>`;
    }

    winerySections += `
      <div style="margin-bottom:24px;">
        <div style="margin-bottom:8px;">
          ${wineryLink}
          ${bookLink ? `<br/>${bookLink}` : ""}
        </div>
        <table style="width:100%;border-collapse:collapse;">${wineRows}</table>
      </div>`;
  }

  const summary = totalWines > 0
    ? `You visited ${data.wineries.length} ${data.wineries.length === 1 ? "winery" : "wineries"} and tasted ${totalWines} ${totalWines === 1 ? "wine" : "wines"}. Here's your trip at a glance.`
    : `You visited ${data.wineries.length} ${data.wineries.length === 1 ? "winery" : "wineries"}. Here's your trip at a glance.`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `Napa Sonoma Guide <noreply@${SITE_DOMAIN}>`,
    to: email,
    subject: `Your Trip Recap: ${data.tripName}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;">
        <h1 style="color:#7f1d1d;font-size:24px;margin-bottom:4px;">Your Trip Recap: ${data.tripName}</h1>
        <p style="color:#6b7280;margin-top:0;">${summary}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
        ${winerySections}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
        <p style="color:#9ca3af;font-size:12px;text-align:center;">
          Sent from <a href="${BASE_URL}" style="color:#7f1d1d;text-decoration:none;">Napa Sonoma Guide</a>
        </p>
      </div>
    `,
  });

  if (error) {
    console.error(`Resend error sending trip recap: ${error.message}`);
    throw new Error("Failed to send email");
  }
}

interface PitchEmailData {
  wineryName: string;
  totalClicks: number;
  periodLabel: string;
  trendPercent: number | null;
  subscriberCount: number;
}

export async function sendWineryPitchEmail(
  recipientEmail: string,
  subject: string,
  data: PitchEmailData
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping pitch email");
    return;
  }

  const resend = new Resend(apiKey);
  const trendLine =
    data.trendPercent !== null && data.trendPercent !== 0
      ? `<p style="color:#059669;font-size:14px;">📈 That's ${data.trendPercent > 0 ? "up" : "down"} <strong>${Math.abs(data.trendPercent)}%</strong> compared to the previous period.</p>`
      : "";

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;">
      <h1 style="color:#7f1d1d;font-size:24px;margin-bottom:4px;">Partnership Opportunity — ${data.wineryName}</h1>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />

      <p>Hi there,</p>

      <p>I'm Michael from <a href="${BASE_URL}" style="color:#7f1d1d;text-decoration:none;font-weight:600;">Napa Sonoma Guide</a>, a wine country discovery platform helping visitors plan their Napa and Sonoma trips.</p>

      <p>Your winery, <strong>${data.wineryName}</strong>, already has a listing on our site. Here's how it's performing:</p>

      <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#7f1d1d;">${data.totalClicks} clicks</p>
        <p style="margin:0;color:#6b7280;font-size:14px;">from engaged wine country visitors (${data.periodLabel})</p>
        ${trendLine}
      </div>

      <p>Our platform reaches <strong>${data.subscriberCount}+ email subscribers</strong> actively planning wine country trips, plus organic search traffic from people searching for Napa and Sonoma wineries.</p>

      <h2 style="color:#7f1d1d;font-size:18px;margin-top:24px;">Featured Listing Benefits</h2>
      <ul style="color:#374151;line-height:1.8;">
        <li>Priority placement in search results and recommendations</li>
        <li>Enhanced listing with more photos, tasting menu details, and video</li>
        <li>"Featured Winery" badge on your listing</li>
        <li>Inclusion in our monthly email to subscribers</li>
        <li>Dedicated blog post or guide feature</li>
      </ul>

      <p>Featured listings start at <strong>$100/month</strong>, cancel anytime. Would you be interested in a quick call to discuss?</p>

      <p>Best,<br/><strong>Michael Chen</strong><br/>Napa Sonoma Guide<br/><a href="${BASE_URL}" style="color:#7f1d1d;text-decoration:none;">${BASE_URL.replace("https://www.", "")}</a></p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      <p style="color:#9ca3af;font-size:12px;text-align:center;">
        Sent from <a href="${BASE_URL}" style="color:#7f1d1d;text-decoration:none;">Napa Sonoma Guide</a>
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: `Napa Sonoma Guide <noreply@${SITE_DOMAIN}>`,
    to: recipientEmail,
    subject,
    html,
  });

  if (error) {
    console.error(`Resend error sending pitch email: ${error.message}`);
    throw new Error("Failed to send pitch email");
  }
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
