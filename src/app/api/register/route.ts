import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getClientIp, isSameOrigin, rateLimitResponse } from "@/lib/security";

export const runtime = "nodejs";

const usernameRegex = /^[a-zA-Z0-9_.-]+$/;

const schema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username is too long")
    .regex(usernameRegex, "Only letters, numbers, _ . - are allowed"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(256),
  vouchedBy: z
    .string()
    .min(1, "Vouched-by username is required")
    .max(64),
});

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const limited = rateLimitResponse(`register:${ip}`, {
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const username = parsed.data.username.toLowerCase();
  const vouchedByName = parsed.data.vouchedBy.toLowerCase();

  if (username === vouchedByName) {
    return NextResponse.json(
      { error: "You cannot vouch for yourself" },
      { status: 400 },
    );
  }

  const voucher = await prisma.user.findUnique({
    where: { username: vouchedByName },
    select: { id: true, status: true },
  });
  if (!voucher || voucher.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Vouched-by user does not exist or is not active" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: "USER",
        status: "PENDING",
        vouchedById: voucher.id,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 },
      );
    }
    throw e;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
