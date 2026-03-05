import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({
        username: users.username,
        isPublic: users.isPublic,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    return NextResponse.json(user || { username: null, isPublic: false });
  } catch (error) {
    console.error("GET /api/user/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, isPublic } = await request.json();

    // Validate username if provided
    if (username !== undefined && username !== null) {
      const trimmed = username.trim().toLowerCase();
      if (trimmed && !/^[a-z0-9_-]{3,30}$/.test(trimmed)) {
        return NextResponse.json(
          {
            error:
              "Username must be 3-30 characters, only letters, numbers, hyphens, underscores",
          },
          { status: 400 }
        );
      }

      // Check uniqueness
      if (trimmed) {
        const [existing] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, trimmed));

        if (existing && existing.id !== session.user.id) {
          return NextResponse.json(
            { error: "Username is already taken" },
            { status: 409 }
          );
        }
      }

      await db
        .update(users)
        .set({ username: trimmed || null })
        .where(eq(users.id, session.user.id));
    }

    if (isPublic !== undefined) {
      await db
        .update(users)
        .set({ isPublic })
        .where(eq(users.id, session.user.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/user/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
