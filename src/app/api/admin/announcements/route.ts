import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/security";

export const runtime = "nodejs";

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  body: z.string().max(2000).optional().default(""),
});

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const announcement = await prisma.announcement.create({
    data: {
      title: parsed.data.title.trim(),
      body: parsed.data.body.trim(),
    },
    select: { id: true, title: true, body: true, createdAt: true },
  });

  return NextResponse.json({ announcement }, { status: 201 });
}
