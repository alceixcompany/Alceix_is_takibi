import Image from "next/image";
import { Building2, ShieldCheck, Target } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { demoUsers } from "@/lib/demo-data";
import { demoModeEnabled } from "@/lib/env";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
      <section className="rounded-[2rem] border border-border/70 bg-white/82 p-6 shadow-[0_25px_80px_-32px_rgba(22,78,58,0.35)] backdrop-blur sm:p-8 lg:p-10">
        <div className="space-y-7">
          <div className="relative h-24 w-full max-w-lg overflow-hidden rounded-2xl bg-white sm:h-28">
            <Image
              src="/alceix-logo.png"
              alt="Alceix Group"
              fill
              sizes="(min-width: 1024px) 520px, 90vw"
              className="object-contain object-left"
              priority
            />
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              Alceix operasyon paneli
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Satış, müşteri ve üretim takibini tek panelden yönet.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              Firma havuzu, arama akışı, ekip görevleri, ödeme ve rapor süreçleri Alceix Panel içinde sade bir ekranda toplanır.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="space-y-3 p-5">
                <Building2 className="size-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Firma havuzu</p>
                  <p className="text-sm text-muted-foreground">CSV yükleme, düzenleme ve takip</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-5">
                <Target className="size-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Satış akışı</p>
                  <p className="text-sm text-muted-foreground">Aranacaklar ve hızlı durumlar</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-5">
                <ShieldCheck className="size-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Yetkili panel</p>
                  <p className="text-sm text-muted-foreground">Admin tüm operasyonu yönetir</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center">
        <LoginForm demoMode={demoModeEnabled} demoUsers={demoUsers} />
      </section>
    </main>
  );
}
