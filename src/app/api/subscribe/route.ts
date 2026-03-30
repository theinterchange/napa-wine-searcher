import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailSubscribers } from "@/db/schema";
import { sendGuideEmail, notifyNewSubscriber } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email;
    const source = body.source;

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

    const normalizedEmail = email.toLowerCase().trim();

    let isNew = false;
    try {
      await db.insert(emailSubscribers).values({ email: normalizedEmail, source });
      isNew = true;
    } catch {
      // Duplicate email — not an error
    }

    sendGuideEmail(normalizedEmail).catch(console.error);
    if (isNew) {
      notifyNewSubscriber(normalizedEmail, source).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Subscribe error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to subscribe", detail: message },
      { status: 500 }
    );
  }
}
