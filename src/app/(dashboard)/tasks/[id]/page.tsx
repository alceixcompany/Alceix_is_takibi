import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { FirmStatusBadge } from "@/components/firms/firm-status-badge";
import { ProductionStatusBadge } from "@/components/production/production-status-badge";
import { ProductionTaskUpdateForm } from "@/components/production/production-task-update-form";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskUpdateForm } from "@/components/tasks/task-update-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasRole, requireUser } from "@/lib/auth";
import { PRODUCT_META, PRODUCTION_ROLES } from "@/lib/constants";
import { loadCrmDataset } from "@/lib/repository";
import { formatDateTime } from "@/lib/utils";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const dataset = await loadCrmDataset(user);
  const task = dataset.productionTasks.find((item) => item.id === id);

  if (!task) {
    notFound();
  }

  const isAdmin = hasRole(user, "admin");
  const isAssignedWorker = task.assigned_to === user.id;
  const isProductionUser = user.role.some((role) => PRODUCTION_ROLES.includes(role));
  const canClaim = !task.assigned_to && isProductionUser;
  const canUpdate = isAdmin || isAssignedWorker || canClaim;
  const productionUsers = dataset.users.filter((item) =>
    item.role.some((role) => PRODUCTION_ROLES.includes(role)),
  );
  const firm = dataset.firms.find((item) => item.id === task.firm_id);
  const userMap = new Map(dataset.users.map((item) => [item.id, item]));
  const activities = dataset.activities.filter((activity) => activity.firm_id === task.firm_id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Görev detay"
        title={task.title}
        description={task.description ?? task.note ?? "Görev için açıklama girilmemiş."}
        actions={
          firm ? (
            <Button asChild variant="outline">
              <Link href={`/firms/${firm.id}`}>Müşteriyi Aç</Link>
            </Button>
          ) : undefined
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Görev bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Hizmet</p>
              <p className="mt-2 font-semibold text-foreground">{PRODUCT_META[task.service_type]?.label}</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Durum</p>
              <div className="mt-2"><ProductionStatusBadge status={task.status} /></div>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Öncelik</p>
              <div className="mt-2"><TaskPriorityBadge priority={task.priority} /></div>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Atanan</p>
              <p className="mt-2 font-semibold text-foreground">
                {task.assigned_to ? userMap.get(task.assigned_to)?.name ?? "Bilinmiyor" : "Atanmamış"}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Teslim tarihi</p>
              <p className="mt-2 font-semibold text-foreground">{formatDateTime(task.due_date)}</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Başladı / tamamlandı</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatDateTime(task.started_at)} / {formatDateTime(task.completed_at)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Görev işlemleri</CardTitle>
            <CardDescription>Üretim ekibi kendi görev durumunu, admin tüm alanları günceller.</CardDescription>
          </CardHeader>
          <CardContent>
            {canClaim ? (
              <ProductionTaskUpdateForm task={task} />
            ) : canUpdate ? (
              <TaskUpdateForm
                task={task}
                firms={dataset.firms}
                users={productionUsers}
                isAdmin={isAdmin}
              />
            ) : (
              <EmptyState title="Salt okunur" description="Satış ekibi üretim durumunu görebilir ancak değiştiremez." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Müşteri bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            {firm ? (
              <div className="space-y-4">
                <div>
                  <Link href={`/firms/${firm.id}`} className="text-lg font-semibold text-foreground hover:text-primary">
                    {firm.company_name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{firm.sector ?? "Sektör yok"} / {firm.city ?? "Şehir yok"}</p>
                </div>
                <FirmStatusBadge status={firm.status} />
                <p className="text-sm text-muted-foreground">{firm.phone ?? "Telefon yok"}</p>
                <p className="text-sm text-muted-foreground">
                  Satışçı: {firm.assigned_to ? userMap.get(firm.assigned_to)?.name ?? "Bilinmiyor" : "Atanmamış"}
                </p>
              </div>
            ) : (
              <EmptyState title="Müşteri bulunamadı" description="Görevin bağlı olduğu firma artık görünmüyor." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivite geçmişi</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kişi</TableHead>
                    <TableHead>Not</TableHead>
                    <TableHead>Zaman</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.slice(0, 10).map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.user_id ? userMap.get(activity.user_id)?.name ?? "Sistem" : "Sistem"}</TableCell>
                      <TableCell>{activity.note ?? "-"}</TableCell>
                      <TableCell>{formatDateTime(activity.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState title="Aktivite yok" description="Görev veya müşteri hareketleri burada listelenir." />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
