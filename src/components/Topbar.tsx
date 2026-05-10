import { getInitials } from "@/lib/utils";

interface TopbarProps {
  username: string;
}

export function Topbar({ username }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-end border-b border-border/60 bg-background/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 select-none items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {getInitials(username)}
        </div>
      </div>
    </header>
  );
}
