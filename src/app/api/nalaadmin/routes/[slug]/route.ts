import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dayTripRoutes, dayTripStops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function requireAdmin() {
  const session = await auth().catch(() => null);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

const updateInput = z.object({
  title: z.string().min(1).max(160).optional(),
  description: z.string().max(2000).nullable().optional(),
  region: z.string().max(64).nullable().optional(),
  theme: z.string().max(64).nullable().optional(),
  estimatedHours: z.number().nullable().optional(),
  heroImageUrl: z.string().url().nullable().optional(),
  groupVibe: z.string().max(120).nullable().optional(),
  duration: z.enum(["half", "full", "weekend"]).nullable().optional(),
  seoKeywords: z.string().max(500).nullable().optional(),
  faqJson: z.string().max(5000).nullable().optional(),
  editorialPull: z.string().max(600).nullable().optional(),
  stops: z
    .array(
      z.object({
        wineryId: z.number().int().positive(),
        notes: z.string().max(500).nullable().optional(),
        suggestedDuration: z.number().int().positive().nullable().optional(),
        isFeatured: z.boolean().optional(),
        valleyVariant: z.enum(["napa", "sonoma", "both"]).optional(),
      })
    )
    .min(0)
    .max(40)
    .optional(),
});

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { slug } = await ctx.params;
    const body = updateInput.parse(await req.json());

    const [route] = await db
      .select()
      .from(dayTripRoutes)
      .where(eq(dayTripRoutes.slug, slug))
      .limit(1);
    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    const metaPatch: Record<string, unknown> = {};
    for (const k of [
      "title",
      "description",
      "region",
      "theme",
      "estimatedHours",
      "heroImageUrl",
      "groupVibe",
      "duration",
      "seoKeywords",
      "faqJson",
      "editorialPull",
    ] as const) {
      if (k in body) metaPatch[k] = body[k];
    }
    metaPatch.curatedAt = new Date().toISOString();

    if (Object.keys(metaPatch).length > 0) {
      await db
        .update(dayTripRoutes)
        .set(metaPatch)
        .where(eq(dayTripRoutes.id, route.id));
    }

    if (body.stops) {
      // Replace-all strategy keeps things simple — stop rows don't have
      // meaningful auxiliary data beyond what the admin form captures.
      await db.delete(dayTripStops).where(eq(dayTripStops.routeId, route.id));
      if (body.stops.length > 0) {
        await db.insert(dayTripStops).values(
          body.stops.map((s, idx) => ({
            routeId: route.id,
            wineryId: s.wineryId,
            stopOrder: idx,
            notes: s.notes ?? null,
            suggestedDuration: s.suggestedDuration ?? null,
            isFeatured: s.isFeatured ?? false,
            valleyVariant: s.valleyVariant ?? "both",
          }))
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/nalaadmin/routes/[slug] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
