import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailSubscribers } from "@/db/schema";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json();

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

    await db.insert(emailSubscribers).values({
      email: email.toLowerCase().trim(),
      source,
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    // Handle unique constraint violation (duplicate email)
    if (err instanceof Error && err.message?.includes("UNIQUE")) {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
