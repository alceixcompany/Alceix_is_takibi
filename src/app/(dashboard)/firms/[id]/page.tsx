import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { FirmAssignmentForm } from "@/components/firms/firm-assignment-form";
import { FirmDeleteForm } from "@/components/firms/firm-delete-form";
import { FirmEditForm } from "@/components/firms/firm-edit-form";
import { FirmNoteForm } from "@/components/firms/firm-note-form";
import { FirmStatusBadge } from "@/components/firms/firm-status-badge";
import { FirmStatusForm } from "@/components/firms/firm-status-form";
import { ProductionTaskTable } from "@/components/production/production-task-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasRole, requireUser } from "@/lib/auth";
import { PRODUCT_META } from "@/lib/constants";
import { loadCrmDataset } from "@/lib/repository";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default async function FirmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const dataset = await loadCrmDataset(user);
  const firm = dataset.firms.find((item) => item.id === id);

  if (!firm) {
    notFound();
  }

  const userMap = new Map(dataset.users.map((item) => [item.id, item]));
  const activities = dataset.activities.filter((activity) => activity.firm_id === firm.id);
  const sales = dataset.sales.filter((sale) => sale.firm_id === firm.id);
  const tasks = dataset.productionTasks.filter((task) => task.firm_id === firm.id);
  const canManageFirm = hasRole(user, "admin") || firm.assigned_to === user.id;
  const isAdmin = hasRole(user, "admin");
  const salesUsers = dataset.users.filter((item) => item.role.includes("sales"));
  const lastCall = activities.find((activity) => activity.type === "call");
  const totalAmount = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const paidAmount = sales
    .filter((sale) => sale.payment_status === "paid")
    .reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Firma detay"
        title={firm.company_name}
        description={firm.note ?? "Bu kayıt için henüz özet not bulunmuyor."}
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Temel bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Durum</p>
              <div className="mt-2">
                <FirmStatusBadge status={firm.status} />
              </div>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Atanan satışçı</p>
              <p className="mt-2 font-semibold text-foreground">
                {firm.assigned_to ? userMap.get(firm.assigned_to)?.name ?? "Bilinmiyor" : "Atanmadı"}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Telefon</p>
              <p className="mt-2 font-semibold text-foreground">{firm.phone ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Website / Instagram</p>
              <p className="mt-2 font-semibold text-foreground">{firm.website ?? firm.instagram ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Son arama / arayan</p>
              <p className="mt-2 font-semibold text-foreground">
                {formatDateTime(firm.last_called_at)} / {lastCall?.user_id ? userMap.get(lastCall.user_id)?.name ?? "Bilinmiyor" : "Yok"}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Takip tarihi</p>
              <p className="mt-2 font-semibold text-foreground">{formatDateTime(firm.next_follow_up_at)}</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Arandı / ilgilendi / ödeme</p>
              <p className="mt-2 font-semibold text-foreground">
                {firm.last_called_at ? "Evet" : "Hayır"} / {["ilgilendi", "teklif_verildi", "odeme_bekleniyor", "odeme_alindi", "uretime_aktarildi", "teslim_edildi"].includes(firm.status) ? "Evet" : "Hayır"} / {paidAmount > 0 ? "Evet" : "Hayır"}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Toplam tutar / ödeme</p>
              <p className="mt-2 font-semibold text-foreground">
                {formatCurrency(totalAmount)} / {paidAmount > 0 ? formatCurrency(paidAmount) : "Bekleniyor"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Durum işlemleri</CardTitle>
              <CardDescription>Satış ekibi ve admin arama sonucunu güncelleyebilir.</CardDescription>
            </CardHeader>
            <CardContent>
              {canManageFirm ? (
                <FirmStatusForm firm={firm} />
              ) : (
                <EmptyState title="Salt okunur görünüm" description="Bu firmada güncelleme yetkin bulunmuyor." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hızlı not</CardTitle>
            </CardHeader>
            <CardContent>
              {canManageFirm ? (
                <FirmNoteForm firmId={firm.id} />
              ) : (
                <EmptyState title="Not eklenemiyor" description="Yetkin olmadığı için bu alan kapalı." />
              )}
            </CardContent>
          </Card>

          {isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle>Satışçı ataması</CardTitle>
                <CardDescription>Admin müşteriyi satış ekibine yeniden atayabilir.</CardDescription>
              </CardHeader>
              <CardContent>
                <FirmAssignmentForm firm={firm} users={salesUsers} />
              </CardContent>
            </Card>
          ) : null}

          {isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle>Tehlikeli işlem</CardTitle>
                <CardDescription>Yanlış eklenen firma kaydını tamamen kaldır.</CardDescription>
              </CardHeader>
              <CardContent>
                <FirmDeleteForm firmId={firm.id} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>


      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Firma bilgilerini düzenle</CardTitle>
            <CardDescription>Admin firma bilgilerini, notu, atamayı ve takip tarihini buradan manuel güncelleyebilir.</CardDescription>
          </CardHeader>
          <CardContent>
            <FirmEditForm firm={firm} users={salesUsers} />
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Aktivite akışı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.length ? (
              activities.map((activity) => (
                <div key={activity.id} className="rounded-2xl border border-border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">
                      {activity.user_id ? userMap.get(activity.user_id)?.name ?? "Sistem" : "Sistem"}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(activity.created_at)}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{activity.note ?? "Detay bulunmuyor."}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Aktivite yok" description="Bu firma için henüz log kaydı bulunmuyor." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Satış kayıtları</CardTitle>
          </CardHeader>
          <CardContent>
            {sales.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Ödeme</TableHead>
                    <TableHead>Prim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{PRODUCT_META[sale.product_type].label}</TableCell>
                      <TableCell>{formatCurrency(sale.amount)}</TableCell>
                      <TableCell>{sale.payment_status === "paid" ? "Alındı" : "Bekleniyor"}</TableCell>
                      <TableCell>{formatCurrency(sale.commission + sale.extra_commission)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState title="Satış kaydı yok" description="Henüz bu firmaya bağlı ürün satışı açılmamış." />
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Üretim görevleri</CardTitle>
          <CardDescription>Ödeme alındığında açılan operasyon akışı burada görünür.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length ? (
            <ProductionTaskTable tasks={tasks} firms={dataset.firms} users={dataset.users} />
          ) : (
            <EmptyState title="Üretim görevi oluşmamış" description="Ödeme alınan satış yoksa görev listesi boş kalır." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
