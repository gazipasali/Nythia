"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LogOut,
  Megaphone,
  ShieldCheck,
  Users as UsersIcon,
  Wrench,
} from "lucide-react";
import { signOut } from "next-auth/react";

import { getAllToolConfigs } from "@/lib/tools-meta";
import type { Role } from "@/lib/enums";
import { cn } from "@/lib/utils";

interface SidebarProps {
  username: string;
  role: Role;
  pendingCount: number;
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  active?: boolean;
}

function NavItem({ href, icon, label, badge, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-foreground"
          : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-foreground",
      )}
    >
      <span className="text-muted-foreground group-hover:text-foreground">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge && badge > 0 ? (
        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted/70">
      {children}
    </div>
  );
}

export function Sidebar({ username, role, pendingCount }: SidebarProps) {
  const pathname = usePathname();

  const tools = getAllToolConfigs();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Wrench className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Nythia</span>
          <span className="text-[10px] text-sidebar-muted">Tools</span>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
        <NavItem
          href="/dashboard"
          icon={<Home className="h-4 w-4" />}
          label="Dashboard"
          active={pathname === "/dashboard"}
        />

        {tools.length > 0 ? (
          <div>
            <SectionHeader>Tools</SectionHeader>
            {tools.map((config) => {
              const Icon = config.icon;
              const href = `/tools/${config.slug}`;
              return (
                <NavItem
                  key={config.slug}
                  href={href}
                  icon={<Icon className="h-4 w-4" />}
                  label={config.name}
                  active={pathname === href}
                />
              );
            })}
          </div>
        ) : null}

        {role === "ADMIN" ? (
          <>
            <SectionHeader>Admin</SectionHeader>
            <NavItem
              href="/admin/requests"
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Requests"
              badge={pendingCount}
              active={pathname.startsWith("/admin/requests")}
            />
            <NavItem
              href="/admin/users"
              icon={<UsersIcon className="h-4 w-4" />}
              label="Users"
              active={pathname.startsWith("/admin/users")}
            />
            <NavItem
              href="/admin/announcements"
              icon={<Megaphone className="h-4 w-4" />}
              label="Announcements"
              active={pathname.startsWith("/admin/announcements")}
            />
          </>
        ) : null}
      </div>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/reports/quarterly" })}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="flex-1 text-left">Sign Out</span>
          <span className="text-xs text-sidebar-muted/80">{username}</span>
        </button>
      </div>
    </aside>
  );
}
