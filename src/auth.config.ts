import type { NextAuthConfig } from "next-auth";

import type { Role, Status } from "@/lib/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
      status: Status;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id?: string;
    username: string;
    role: Role;
    status: Status;
  }
}

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/reports/quarterly" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.username = user.username;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.role = token.role as Role;
      session.user.status = token.status as Status;
      return session;
    },
    authorized: async ({ request, auth }) => {
      const { pathname } = request.nextUrl;

      const isAuthPath =
        pathname.startsWith("/reports/quarterly") ||
        pathname.startsWith("/reports/access");
      const isAdminPath = pathname.startsWith("/admin");
      const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/tools") ||
        isAdminPath;

      if (pathname === "/") return true;

      if (isAuthPath) {
        if (auth?.user.status === "ACTIVE") {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      if (isProtected) {
        if (!auth?.user) return false;
        if (auth.user.status !== "ACTIVE") return false;
        if (isAdminPath && auth.user.role !== "ADMIN") {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      return true;
    },
  },
};
