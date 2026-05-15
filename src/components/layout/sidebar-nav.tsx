"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { navItems } from "@/lib/navigation";
import type { AppUser } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SidebarNav({ user }: { user: AppUser }) {
  const pathname = usePathname();
  const items = navItems.filter((item) => item.roles.some((role) => user.role.includes(role)));

  return (
    <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-12 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="min-w-0 truncate">{item.label}</span>
            {active ? <Badge className="shrink-0 border border-white/20 bg-white/10 text-white">Açık</Badge> : null}
          </Link>
        );
      })}
    </nav>
  );
}
