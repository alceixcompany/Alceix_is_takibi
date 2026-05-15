import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { RoleBadges } from "@/components/firms/role-badges";
import { ProductionTaskTable } from "@/components/production/production-task-table";
import { TeamMemberEditForm } from "@/components/team/team-member-edit-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buildEmployeeTaskCounts, getSalesPerformanceStats } from "@/lib/analytics";
import { requireAdmin } from "@/lib/auth";
import { loadCrmDataset } from "@/lib/repository";
import { formatCurrency } from "@/lib/utils";

export default async function TeamMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const dataset = await loadCrmDataset(admin);
  const member = dataset.users.find((user) => user.id === id);

  if (!member) {
    notFound();
  }

  const salesStats = getSalesPerformanceStats(dataset).find((row) => row.user.id === member.id);
  const taskStats = buildEmployeeTaskCounts(member, dataset.productionTasks);
  const memberTasks = dataset.productionTasks.filter((task) => task.assigned_to === member.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ekip detayı"
        title={member.name}
        description="Çalışan profili, rol bilgileri, satış performansı ve görev yükü."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Atanan müşteri" value={String(salesStats?.assignedCustomers ?? 0)} detail="Satış portföyü" />
        <StatCard label="Aranan müşteri" value={String(salesStats?.totalCalledCustomers ?? 0)} detail="Tekil müşteri" accent="sky" />
        <StatCard label="Ciro" value={formatCurrency(salesStats?.revenue ?? 0)} detail="Ödeme alınan satış" accent="amber" />
        <StatCard label="Aktif görev" value={String(taskStats.active)} detail={`${taskStats.done} tamamlandı`} accent="indigo" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Auth e-posta güncellemesi için service role varsa auth.users ile senkronlanır.</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamMemberEditForm user={member} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rol ve durum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RoleBadges roles={member.role} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Aktiflik</p>
                  <p className="mt-1 font-semibold text-foreground">{member.active ? "Aktif" : "Pasif"}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Aylık hedef</p>
                  <p className="mt-1 font-semibold text-foreground">{member.monthly_target}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Satış performansı</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-muted/40 p-4">Ulaşılamayan: {salesStats?.unreachableCustomers ?? 0}</div>
              <div className="rounded-2xl bg-muted/40 p-4">İlgilenen: {salesStats?.interestedCustomers ?? 0}</div>
              <div className="rounded-2xl bg-muted/40 p-4">Teklif verilen: {salesStats?.offeredCustomers ?? 0}</div>
              <div className="rounded-2xl bg-muted/40 p-4">Toplam prim: {formatCurrency(salesStats?.commission ?? 0)}</div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Atanan üretim görevleri</CardTitle>
        </CardHeader>
        <CardContent>
          {memberTasks.length ? (
            <ProductionTaskTable tasks={memberTasks} firms={dataset.firms} users={dataset.users} editable />
          ) : (
            <EmptyState title="Görev yok" description="Bu çalışana atanmış üretim görevi bulunmuyor." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
