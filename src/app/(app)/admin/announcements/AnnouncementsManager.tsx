"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Megaphone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatShortDateTime } from "@/lib/utils";

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export function AnnouncementsManager({
  items,
}: {
  items: AnnouncementItem[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to publish");
        return;
      }
      setTitle("");
      setBody("");
      toast.success("Announcement published");
      startTransition(() => router.refresh());
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to delete");
        return;
      }
      toast.success("Announcement deleted");
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ann-title">Title</Label>
          <Input
            id="ann-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's new?"
            maxLength={120}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ann-body">Body</Label>
          <Textarea
            id="ann-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Optional details..."
            maxLength={2000}
            className="min-h-[120px] font-sans"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting || !title.trim()}>
            <Megaphone className="h-4 w-4" />
            {submitting ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          {items.length} announcement{items.length === 1 ? "" : "s"}
        </h2>
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 px-5 py-8 text-center text-sm text-muted-foreground">
            No announcements yet.
          </p>
        ) : (
          <ul className="divide-y divide-border/40 rounded-md border border-border/40">
            {items.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-accent/30"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Megaphone className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{a.title}</p>
                  {a.body ? (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {a.body}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground/80">
                    {formatShortDateTime(new Date(a.createdAt))}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(a.id, a.title)}
                  disabled={busyId === a.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
