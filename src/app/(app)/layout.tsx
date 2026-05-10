import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import type { Role } from "@/lib/enums";

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    redirect("/reports/quarterly");
  }

  const fresh = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, role: true, status: true },
  });

  if (!fresh || fresh.status !== "ACTIVE") {
    const cookieStore = cookies();
    for (const name of SESSION_COOKIES) {
      cookieStore.delete(name);
    }
    redirect("/reports/quarterly");
  }

  const role = fresh.role as Role;
  const pendingCount =
    role === "ADMIN"
      ? await prisma.user.count({ where: { status: "PENDING" } })
      : 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        username={fresh.username}
        role={role}
        pendingCount={pendingCount}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar username={fresh.username} />
        <main className="flex-1 overflow-y-auto px-6 py-8 scrollbar-thin">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
