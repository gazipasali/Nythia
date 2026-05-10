import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/security";

export const runtime = "nodejs";

const patchSchema = z.object({
  action: z.enum(["deactivate", "activate"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const session = guard.session;

  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot modify your own account here" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.user.update({
    where: { id: target.id },
    data: {
      status: parsed.data.action === "deactivate" ? "REJECTED" : "ACTIVE",
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const session = guard.session;

  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { vouchedById: target.id },
      data: { vouchedById: null },
    }),
    prisma.user.delete({ where: { id: target.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
