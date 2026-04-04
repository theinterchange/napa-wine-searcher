import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { outboundClicks } from "@/db/schema";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function POST(req: NextRequest) {
  try {
    // Skip tracking for admin user
    const session = await auth();
    if (session?.user?.email && session.user.email === ADMIN_EMAIL) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const body = await req.json();
    const { wineryId, accommodationId, clickType, destinationUrl, sourcePage, sourceComponent } =
      body;

    if (!clickType || !destinationUrl) {
      return NextResponse.json(
        { error: "clickType and destinationUrl are required" },
        { status: 400 }
      );
    }

    await db.insert(outboundClicks).values({
      wineryId: wineryId ?? null,
      accommodationId: accommodationId ?? null,
      clickType,
      destinationUrl,
      sourcePage: sourcePage ?? null,
      sourceComponent: sourceComponent ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to track click" }, { status: 500 });
  }
}
