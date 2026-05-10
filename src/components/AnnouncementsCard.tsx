import { Megaphone } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatShortDateTime } from "@/lib/utils";

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
}

export function AnnouncementsCard({
  items,
}: {
  items: AnnouncementItem[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          items.map((a) => (
            <div key={a.id} className="flex gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Megaphone className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-sm font-medium">{a.title}</p>
                {a.body ? (
                  <p className="text-sm text-muted-foreground">{a.body}</p>
                ) : null}
                <p className="text-xs text-muted-foreground/80">
                  {formatShortDateTime(a.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
