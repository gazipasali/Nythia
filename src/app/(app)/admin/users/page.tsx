import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersTable } from "./UsersTable";

export const metadata: Metadata = { title: "Users · Nythia" };

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) return null;

  const users = await prisma.user.findMany({
    include: { vouchedBy: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });

  const items = users.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    status: u.status,
    vouchedBy: u.vouchedBy?.username ?? "—",
    createdAt: u.createdAt.toISOString(),
    isSelf: u.id === session.user.id,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage all accounts on the platform.
        </p>
      </header>

      <Card>
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {items.length} total
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <UsersTable items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
