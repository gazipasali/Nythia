import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/security";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  const target = await prisma.announcement.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.announcement.delete({ where: { id: target.id } });

  return NextResponse.json({ ok: true });
}
