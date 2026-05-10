import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementsCard } from "@/components/AnnouncementsCard";
import { AboutUserCard } from "@/components/AboutUserCard";
import { formatLongDate, getInitials, greetingFor } from "@/lib/utils";
import type { Role } from "@/lib/enums";

export const metadata: Metadata = { title: "Dashboard · Nythia" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const username = session.user.username;
  const role = session.user.role as Role;

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          General statistics are displayed here.
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {getInitials(username)}
            </div>
            <p className="text-sm">
              {greetingFor()},{" "}
              <span className="font-semibold">{username}</span>
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{formatLongDate()}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <AnnouncementsCard
          items={announcements.map((a) => ({
            id: a.id,
            title: a.title,
            body: a.body,
            createdAt: a.createdAt,
          }))}
        />
        <AboutUserCard username={username} role={role} />
      </div>
    </div>
  );
}
