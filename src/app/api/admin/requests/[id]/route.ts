import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/security";

export const runtime = "nodejs";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, status: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (target.status !== "PENDING") {
    return NextResponse.json(
      { error: "Request is no longer pending" },
      { status: 409 },
    );
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { status: parsed.data.action === "approve" ? "ACTIVE" : "REJECTED" },
  });

  return NextResponse.json({ ok: true });
}
