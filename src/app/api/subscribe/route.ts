import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailSubscribers } from "@/db/schema";
import { sendGuideEmail, notifyNewSubscriber } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let normalizedEmail = "";
  let source: "itinerary" | "guide" | "exit_intent" = "guide";

  try {
    const body = await req.json();
    const email = body.email;
    source = body.source;

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (!source) {
      return NextResponse.json(
        { error: "Source is required" },
        { status: 400 }
      );
    }

    normalizedEmail = email.toLowerCase().trim();

    await db.insert(emailSubscribers).values({
      email: normalizedEmail,
      source,
    });

    sendGuideEmail(normalizedEmail).catch(console.error);
    notifyNewSubscriber(normalizedEmail, source).catch(console.error);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    // Handle unique constraint violation (duplicate email)
    if (err instanceof Error && err.message?.includes("UNIQUE")) {
      sendGuideEmail(normalizedEmail).catch(console.error);
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
