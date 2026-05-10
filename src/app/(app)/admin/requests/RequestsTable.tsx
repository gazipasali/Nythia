"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatShortDateTime } from "@/lib/utils";

interface RequestItem {
  id: string;
  username: string;
  vouchedBy: string;
  createdAt: string;
}

export function RequestsTable({ items }: { items: RequestItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Action failed");
        return;
      }
      toast.success(action === "approve" ? "User approved" : "Request rejected");
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-muted-foreground">
        No pending requests.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr className="border-b border-border/40">
            <th className="px-5 py-3 font-medium">Username</th>
            <th className="px-5 py-3 font-medium">Vouched by</th>
            <th className="px-5 py-3 font-medium">Requested</th>
            <th className="px-5 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr
              key={r.id}
              className="border-b border-border/30 last:border-b-0 hover:bg-accent/30"
            >
              <td className="px-5 py-3 font-medium">{r.username}</td>
              <td className="px-5 py-3 text-muted-foreground">{r.vouchedBy}</td>
              <td className="px-5 py-3 text-muted-foreground">
                {formatShortDateTime(new Date(r.createdAt))}
              </td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    disabled={busyId === r.id}
                    onClick={() => act(r.id, "approve")}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busyId === r.id}
                    onClick={() => act(r.id, "reject")}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
