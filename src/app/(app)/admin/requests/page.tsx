import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RequestsTable } from "./RequestsTable";

export const metadata: Metadata = { title: "Requests · Nythia" };

export default async function AdminRequestsPage() {
  const requests = await prisma.user.findMany({
    where: { status: "PENDING" },
    include: { vouchedBy: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });

  const items = requests.map((r) => ({
    id: r.id,
    username: r.username,
    vouchedBy: r.vouchedBy?.username ?? "—",
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Pending Requests</h1>
        <p className="text-sm text-muted-foreground">
          Approve or reject incoming registration requests.
        </p>
      </header>

      <Card>
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {items.length} request{items.length === 1 ? "" : "s"} waiting
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <RequestsTable items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
