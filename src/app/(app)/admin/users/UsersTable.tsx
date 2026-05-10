"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn, formatShortDateTime } from "@/lib/utils";

interface UserItem {
  id: string;
  username: string;
  role: string;
  status: string;
  vouchedBy: string;
  createdAt: string;
  isSelf: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-400",
  PENDING: "bg-amber-500/15 text-amber-400",
  REJECTED: "bg-rose-500/15 text-rose-400",
};

export function UsersTable({ items }: { items: UserItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function patch(id: string, action: "deactivate" | "activate") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Action failed");
        return;
      }
      toast.success(action === "deactivate" ? "User deactivated" : "User activated");
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, username: string) {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Action failed");
        return;
      }
      toast.success("User deleted");
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-muted-foreground">
        No users yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr className="border-b border-border/40">
            <th className="px-5 py-3 font-medium">Username</th>
            <th className="px-5 py-3 font-medium">Role</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Vouched by</th>
            <th className="px-5 py-3 font-medium">Joined</th>
            <th className="px-5 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr
              key={u.id}
              className="border-b border-border/30 last:border-b-0 hover:bg-accent/30"
            >
              <td className="px-5 py-3 font-medium">
                {u.username}
                {u.isSelf ? (
                  <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                ) : null}
              </td>
              <td className="px-5 py-3 text-muted-foreground">
                {u.role === "ADMIN" ? "Admin" : "Searcher"}
              </td>
              <td className="px-5 py-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    STATUS_STYLES[u.status] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {u.status}
                </span>
              </td>
              <td className="px-5 py-3 text-muted-foreground">{u.vouchedBy}</td>
              <td className="px-5 py-3 text-muted-foreground">
                {formatShortDateTime(new Date(u.createdAt))}
              </td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-2">
                  {u.status === "ACTIVE" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={u.isSelf || busyId === u.id}
                      onClick={() => patch(u.id, "deactivate")}
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Deactivate
                    </Button>
                  ) : u.status === "REJECTED" || u.status === "PENDING" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={u.isSelf || busyId === u.id}
                      onClick={() => patch(u.id, "activate")}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Activate
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={u.isSelf || busyId === u.id}
                    onClick={() => remove(u.id, u.username)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
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
