import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { z } from "zod";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/security";
import type { Role, Status } from "@/lib/enums";

const credentialsSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});

export class AccountPendingError extends CredentialsSignin {
  code = "AccountPending";
}

export class AccountRejectedError extends CredentialsSignin {
  code = "AccountRejected";
}

export class InvalidCredentialsError extends CredentialsSignin {
  code = "InvalidCredentials";
}

export class TooManyAttemptsError extends CredentialsSignin {
  code = "TooManyAttempts";
}

function getIp(): string {
  try {
    const h = headers();
    const fwd = h.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
    return h.get("x-real-ip") ?? "unknown";
  } catch {
    return "unknown";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) throw new InvalidCredentialsError();

        const { username, password } = parsed.data;
        const normalized = username.toLowerCase();

        const ip = getIp();
        const ipLimit = rateLimit(`login:ip:${ip}`, {
          limit: 20,
          windowMs: 10 * 60_000,
        });
        if (!ipLimit.ok) throw new TooManyAttemptsError();

        const userLimit = rateLimit(`login:user:${normalized}`, {
          limit: 8,
          windowMs: 10 * 60_000,
        });
        if (!userLimit.ok) throw new TooManyAttemptsError();

        const user = await prisma.user.findUnique({
          where: { username: normalized },
        });
        if (!user) {
          await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvali");
          throw new InvalidCredentialsError();
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) throw new InvalidCredentialsError();

        if (user.status === "PENDING") throw new AccountPendingError();
        if (user.status === "REJECTED") throw new AccountRejectedError();

        return {
          id: user.id,
          username: user.username,
          role: user.role as Role,
          status: user.status as Status,
        };
      },
    }),
  ],
});
