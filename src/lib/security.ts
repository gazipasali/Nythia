import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

const FORBIDDEN = NextResponse.json(
  { error: "Forbidden" },
  { status: 403 },
);

export function getClientIp(req: Request): string {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true };
  }
  if (existing.count >= options.limit) {
    return { ok: false, retryAfterMs: existing.resetAt - now };
  }
  existing.count += 1;
  return { ok: true };
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets) {
      if (entry.resetAt <= now) buckets.delete(key);
    }
  }, 60_000).unref?.();
}

export function rateLimitResponse(
  key: string,
  options: { limit: number; windowMs: number },
): NextResponse | null {
  const result = rateLimit(key, options);
  if (result.ok) return null;
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": Math.ceil(result.retryAfterMs / 1000).toString(),
      },
    },
  );
}

export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!host) return false;
  if (!origin) {
    const referer = req.headers.get("referer");
    if (!referer) return true;
    try {
      const refUrl = new URL(referer);
      return refUrl.host === host;
    } catch {
      return false;
    }
  }
  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export async function requireAdmin(req: Request) {
  if (!isSameOrigin(req)) {
    return { error: FORBIDDEN, session: null } as const;
  }

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: FORBIDDEN, session: null } as const;
  }

  const fresh = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true },
  });
  if (!fresh || fresh.role !== "ADMIN" || fresh.status !== "ACTIVE") {
    return { error: FORBIDDEN, session: null } as const;
  }

  return { error: null, session } as const;
}
