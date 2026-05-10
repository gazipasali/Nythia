import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnnouncementsManager } from "./AnnouncementsManager";

export const metadata: Metadata = { title: "Announcements · Nythia" };

export default async function AdminAnnouncementsPage() {
  const items = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Announcements</h1>
        <p className="text-sm text-muted-foreground">
          Post a new announcement or delete existing ones. They appear on every
          user&apos;s dashboard.
        </p>
      </header>

      <Card>
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            New announcement
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <AnnouncementsManager
            items={items.map((a) => ({
              id: a.id,
              title: a.title,
              body: a.body,
              createdAt: a.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
