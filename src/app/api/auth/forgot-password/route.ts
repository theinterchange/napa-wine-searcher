import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3 });

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const { success } = limiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: true });
    }

    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email));

    // Only send reset for credentials users (those with a passwordHash)
    if (user?.passwordHash) {
      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.insert(verificationTokens).values({
        identifier: email,
        token,
        expires,
      });

      await sendPasswordResetEmail(email, token);
    }

    // Always return success to not leak email existence
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
