import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outboundClicks } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wineryId, clickType, destinationUrl, sourcePage, sourceComponent } =
      body;

    if (!clickType || !destinationUrl) {
      return NextResponse.json(
        { error: "clickType and destinationUrl are required" },
        { status: 400 }
      );
    }

    await db.insert(outboundClicks).values({
      wineryId: wineryId ?? null,
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
