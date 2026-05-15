import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProgressMeter } from "@/components/dashboard/progress-meter";
import { StatCard } from "@/components/dashboard/stat-card";
import { FirmStatusBadge } from "@/components/firms/firm-status-badge";
import { CommissionTable } from "@/components/reports/commission-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buildAdminMetrics, buildEmployeeTaskCounts, buildSalesMetrics, getSalesPerformanceStats } from "@/lib/analytics";
import { hasRole, requireUser } from "@/lib/auth";
import { PRODUCT_META } from "@/lib/constants";
import { loadCrmDataset } from "@/lib/repository";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const dataset = await loadCrmDataset(user);
  const isAdmin = hasRole(user, "admin");
  const isSales = hasRole(user, "sales");

  if (isAdmin) {
    const metrics = buildAdminMetrics(dataset);
    const salesPerformance = getSalesPerformanceStats(dataset);

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin dashboard"
          title="Satış operasyon özeti"
          description="Firma havuzu, ekip performansı, tahsilatlar ve prim görünümü tek bakışta."
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/firms/import">CSV Yükle</Link>
              </Button>
              <Button asChild>
                <Link href="/firms/new">Yeni Firma Ekle</Link>
              </Button>
            </>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Toplam firma" value={String(metrics.totalFirms)} detail="Havuzdaki tüm kayıtlar" />
          <StatCard label="Bugünkü arama" value={String(metrics.todayCalls)} detail="Çağrı aktiviteleri" accent="sky" />
          <StatCard label="Ödeme bekleyen" value={String(metrics.paymentPendingCount)} detail="Tahsilat takip listesi" accent="amber" />
          <StatCard label="Ödeme alınan" value={String(metrics.paymentReceivedCount)} detail="Kesinleşen müşteriler" accent="indigo" />
          <StatCard label="Toplam ciro" value={formatCurrency(metrics.revenue)} detail="Ödeme alınan satışlar" accent="amber" />
          <StatCard label="Toplam prim" value={formatCurrency(metrics.totalCommission)} detail="Aylık hak ediş" accent="indigo" />
          <StatCard label="Aktif görev" value={String(metrics.activeTasks)} detail="Üretimdeki işler" accent="sky" />
          <StatCard label="Geciken görev" value={String(metrics.overdueTasks)} detail="Teslim tarihi geçenler" accent="amber" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader>
              <CardTitle>Kişi bazlı satış ve prim raporu</CardTitle>
              <CardDescription>Bu ay kapanan satışlar üzerinden hesaplanan prim tablosu.</CardDescription>
            </CardHeader>
            <CardContent>
              <CommissionTable rows={metrics.commissionRows} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Anlık durum</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">İlgilenen firma</p>
                  <p className="text-2xl font-semibold text-foreground">{metrics.interestedFirmCount}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Ödeme bekleyen</p>
                  <p className="text-2xl font-semibold text-foreground">{metrics.paymentPendingCount}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Ödeme alınan</p>
                  <p className="text-2xl font-semibold text-foreground">{metrics.paymentReceivedCount}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Çalışan bazlı görev dağılımı</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.taskDistribution.filter((row) => row.count > 0).map((row) => (
                  <div key={row.user.id} className="rounded-2xl border border-border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{row.user.name}</p>
                      <p className="text-lg font-semibold text-foreground">{row.count}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{row.user.email}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sıcak firmalar</CardTitle>
              <CardDescription>İlgilenen veya ödeme sürecinde olan öncelikli kayıtlar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dataset.firms
                .filter((firm) => ["ilgilendi", "odeme_bekleniyor", "odeme_alindi"].includes(firm.status))
                .slice(0, 6)
                .map((firm) => (
                  <div key={firm.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Link href={`/firms/${firm.id}`} className="font-semibold text-foreground hover:text-primary">
                          {firm.company_name}
                        </Link>
                        <p className="text-sm text-muted-foreground">{firm.city ?? "Şehir yok"}</p>
                      </div>
                      <FirmStatusBadge status={firm.status} />
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Satışçı bazlı performans</CardTitle>
              <CardDescription>Arama, ciro ve prim görünümü.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {salesPerformance.slice(0, 6).map((row) => (
                <div key={row.user.id} className="rounded-2xl border border-border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{row.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {row.paymentReceivedCustomers} ödeme / {formatCurrency(row.revenue)} ciro
                      </p>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(row.commission)}</p>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/reports">Rapor</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  if (isSales) {
    const metrics = buildSalesMetrics(user, dataset);
    const salesPerformance = getSalesPerformanceStats(dataset).find((row) => row.user.id === user.id);

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Satış dashboard"
          title={`Hoş geldin, ${user.name}`}
          description="Atanmış firmaların, günlük arama hedefin ve prim görünümün burada."
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/assigned">Bana Atananlar</Link>
              </Button>
              <Button asChild>
                <Link href="/sales/close">Satış Kapat</Link>
              </Button>
            </>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Atanan firmalar" value={String(metrics.assignedFirms)} detail="Aktif portföyün" />
          <StatCard label="Bugünkü arama" value={String(metrics.todayCalls)} detail={`Hedef ${metrics.todayTarget}`} accent="sky" />
          <StatCard label="Kapanan satışlar" value={String(metrics.closedSales)} detail="Ödeme alınan kayıtlar" accent="amber" />
          <StatCard label="Hak edilen prim" value={formatCurrency(metrics.commission.totalCommission)} detail="Aylık hesap" accent="indigo" />
          <StatCard label="Ödeme bekleyen" value={String(metrics.paymentPending)} detail="Takipteki tahsilatlar" accent="sky" />
          <StatCard label="Dönüşüm oranı" value={`${Math.round((salesPerformance?.conversionRate ?? metrics.conversionRate) * 100)}%`} detail="Aranan müşteriden ödemeye" accent="amber" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Portföy durumu</CardTitle>
              <CardDescription>Aramaya hazır ve takip bekleyen firmaların özeti.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">İlgilenen</p>
                <p className="text-2xl font-semibold text-foreground">{metrics.interestedFirms}</p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Ödeme bekleyen</p>
                <p className="text-2xl font-semibold text-foreground">{metrics.paymentPending}</p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Kesinleşen</p>
                <p className="text-2xl font-semibold text-foreground">{metrics.closedSales}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hedef ilerleyişi</CardTitle>
              <CardDescription>Aylık hedefe göre prim eşiği takibi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ProgressMeter value={metrics.todayCalls / metrics.todayTarget} label="Günlük arama hedefi" />
              <ProgressMeter
                value={metrics.commission.progressRatio}
                label={`Aylık hedef uygunluğu (${metrics.commission.targetQualifiedSales}/${user.monthly_target || 0})`}
              />
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Son atanan firmalar</CardTitle>
            <CardDescription>Bugün temas edilmesi gereken öncelikli kayıtlar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataset.firms.slice(0, 6).map((firm) => (
              <div key={firm.id} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Link href={`/firms/${firm.id}`} className="font-semibold text-foreground hover:text-primary">
                      {firm.company_name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{firm.note ?? "Not yok"}</p>
                  </div>
                  <FirmStatusBadge status={firm.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Çalışan dashboard"
        title={`Merhaba, ${user.name}`}
        description="Sana atanan işler, bugün teslim edilecekler ve geciken görevlerin burada."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(() => {
          const counts = buildEmployeeTaskCounts(user, dataset.productionTasks);
          const today = dataset.productionTasks.filter((task) => {
            if (!task.due_date) return false;
            return new Date(task.due_date).toDateString() === new Date().toDateString();
          }).length;

          return (
            <>
              <StatCard label="Bana atanan işler" value={String(counts.total)} detail="Tüm görevler" />
              <StatCard label="Bugün yapılacaklar" value={String(today)} detail="Teslim tarihi bugün" accent="sky" />
              <StatCard label="Geciken işler" value={String(counts.overdue)} detail="Teslim tarihi geçen" accent="amber" />
              <StatCard label="Tamamlanan işler" value={String(counts.done)} detail="Done durumundaki görevler" accent="indigo" />
            </>
          );
        })()}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Görevlerim</CardTitle>
          <CardDescription>Üretim panelinden durum güncelleyebilir ve detaylara gidebilirsin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dataset.productionTasks.length ? (
            dataset.productionTasks.slice(0, 8).map((task) => (
              <div key={task.id} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Link href={`/tasks/${task.id}`} className="font-semibold text-foreground hover:text-primary">
                      {task.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {PRODUCT_META[task.service_type]?.label} - {formatDateTime(task.due_date)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/tasks/${task.id}`}>Aç</Link>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="Görev yok" description="Sana görev atandığında burada görünür." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
