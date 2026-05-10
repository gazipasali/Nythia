import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import type { Role } from "@/lib/enums";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  USER: "Searcher",
};

export function AboutUserCard({
  username,
  role,
}: {
  username: string;
  role: Role;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>About User</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-2xl font-semibold text-primary">
          {getInitials(username)}
        </div>
        <div className="space-y-1">
          <p className="font-semibold">{username}</p>
          <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
        </div>
      </CardContent>
    </Card>
  );
}
