import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { pitchEmails, wineries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendWineryPitchEmail } from "@/lib/email";
import { getTotalClicks, getSubscriberStats } from "@/lib/analytics-queries";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { wineryId, subject, recipientEmail, periodDays } = await req.json();

    if (!wineryId || !subject || !recipientEmail) {
      return NextResponse.json(
        { error: "wineryId, subject, and recipientEmail are required" },
        { status: 400 }
      );
    }

    // Get winery info
    const [winery] = await db
      .select({ name: wineries.name })
      .from(wineries)
      .where(eq(wineries.id, wineryId));

    if (!winery) {
      return NextResponse.json({ error: "Winery not found" }, { status: 404 });
    }

    const days = periodDays || 30;
    const startDate = new Date(Date.now() - days * 86400000).toISOString();
    const periodLabel = `last ${days} days`;

    const [totalClicks, subscribers] = await Promise.all([
      getTotalClicks(startDate),
      getSubscriberStats(null),
    ]);

    await sendWineryPitchEmail(recipientEmail, subject, {
      wineryName: winery.name,
      totalClicks,
      periodLabel,
      trendPercent: null,
      subscriberCount: subscribers.total,
    });

    // Log the pitch
    await db.insert(pitchEmails).values({
      wineryId,
      recipientEmail,
      subject,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Pitch email error:", error);
    return NextResponse.json(
      { error: "Failed to send pitch email" },
      { status: 500 }
    );
  }
}
