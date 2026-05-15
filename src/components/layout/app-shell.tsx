import Image from "next/image";

import { RoleBadges } from "@/components/firms/role-badges";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { LogoutForm } from "@/components/layout/logout-form";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import type { AppUser } from "@/lib/types";
import { getInitials } from "@/lib/utils";

export function AppShell({
  user,
  children,
}: Readonly<{
  user: AppUser;
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-4 p-3 sm:p-4 lg:flex-row lg:p-6">
        <aside className="w-full lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:max-w-xs">
          <Card className="h-full overflow-hidden">
            <CardContent className="flex max-h-[88vh] flex-col gap-4 overflow-y-auto p-4 sidebar-scroll sm:p-5 lg:max-h-full">
              <div className="space-y-3">
                <div className="rounded-2xl border border-border bg-white px-3 py-3 shadow-sm">
                  <div className="relative h-14 w-full overflow-hidden rounded-xl bg-white sm:h-16">
                    <Image
                      src="/alceix-logo.png"
                      alt="Alceix Group"
                      fill
                      sizes="(min-width: 1024px) 280px, 100vw"
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                  <div className="mt-3 min-w-0">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Operasyon paneli</p>
                    <h1 className="truncate text-lg font-semibold text-foreground">{APP_NAME}</h1>
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                      {getInitials(user.name)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-semibold text-foreground">{user.name}</p>
                      <p className="break-all text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 overflow-x-auto pb-1">
                    <RoleBadges roles={user.role} />
                  </div>
                </div>
              </div>

              <SidebarNav user={user} />

              <div className="mt-auto flex flex-col gap-3">
                <LogoutForm />
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 space-y-4 overflow-hidden">
          <div className="flex min-w-0 flex-col gap-3 rounded-3xl border border-border/80 bg-white/80 px-4 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Operasyon görünümü</p>
              <p className="break-words text-sm font-semibold text-foreground sm:text-base">Güncel Alceix satış, müşteri ve üretim metrikleri</p>
            </div>
            <div className="hidden md:block">
              <LogoutForm />
            </div>
          </div>
          <div className="min-w-0 space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
