import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  const requests = await prisma.user.findMany({
    where: { status: "PENDING" },
    select: {
      id: true,
      username: true,
      createdAt: true,
      vouchedBy: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      username: r.username,
      vouchedBy: r.vouchedBy?.username ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
