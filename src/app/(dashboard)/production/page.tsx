import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProductionTaskTable } from "@/components/production/production-task-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { buildProductionMetrics } from "@/lib/analytics";
import { hasRole, requireUser } from "@/lib/auth";
import { PRODUCT_OPTIONS, PRODUCTION_ROLES, PRODUCTION_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from "@/lib/constants";
import { loadCrmDataset } from "@/lib/repository";

export default async function ProductionPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; status?: string; priority?: string; assignee?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const dataset = await loadCrmDataset(user);
  const isAdmin = hasRole(user, "admin");
  const isProductionUser = user.role.some((role) => PRODUCTION_ROLES.includes(role));
  const productionUsers = dataset.users.filter((item) =>
    item.role.some((role) => PRODUCTION_ROLES.includes(role)),
  );
  const tasks = dataset.productionTasks.filter((task) => {
    const activeProductionMatch = params.status ? true : !["done", "cancelled"].includes(task.status);
    const serviceMatch = !params.service || task.service_type === params.service;
    const statusMatch = !params.status || task.status === params.status;
    const priorityMatch = !params.priority || task.priority === params.priority;
    const assigneeMatch = !params.assignee || task.assigned_to === params.assignee;

    return activeProductionMatch && serviceMatch && statusMatch && priorityMatch && assigneeMatch;
  });
  const metrics = buildProductionMetrics(tasks);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Üretim takip"
        title="Üretim havuzu"
        description="Developer ve üretim ekibi için aktif iş ekranı. Tüm arşiv ve teslim edilen işler Tüm Görevler sayfasında tutulur."
        actions={
          isAdmin ? (
            <Button asChild>
              <Link href="/tasks/new">Yeni Görev</Link>
            </Button>
          ) : undefined
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bekleyen işler" value={String(metrics.pending)} detail="Todo durumundaki görevler" />
        <StatCard label="Devam eden" value={String(metrics.inProgress)} detail="Aktif üretim işleri" accent="sky" />
        <StatCard label="Teslim edilecek" value={String(metrics.readyToDeliver ?? 0)} detail="Kontrol/teslim bekleyen" accent="amber" />
        <StatCard label="Teslim edildi" value={String(metrics.delivered)} detail="Müşteriye teslim edilen" accent="indigo" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <Select name="service" defaultValue={params.service ?? ""}>
              <option value="">Hizmete göre</option>
              {PRODUCT_OPTIONS.map((product) => (
                <option key={product.value} value={product.value}>{product.label}</option>
              ))}
            </Select>
            <Select name="status" defaultValue={params.status ?? ""}>
              <option value="">Duruma göre</option>
              {PRODUCTION_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </Select>
            <Select name="priority" defaultValue={params.priority ?? ""}>
              <option value="">Önceliğe göre</option>
              {TASK_PRIORITY_OPTIONS.map((priority) => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </Select>
            <Select name="assignee" defaultValue={params.assignee ?? ""}>
              <option value="">Kişiye göre</option>
              {productionUsers.map((worker) => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
            </Select>
            <Button type="submit">Uygula</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktif üretim akışı</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length ? (
            <ProductionTaskTable
              tasks={tasks}
              firms={dataset.firms}
              users={dataset.users}
              editable={isAdmin || isProductionUser}
            />
          ) : (
            <EmptyState title="Üretim görevi yok" description="Ödeme alınan müşteriler veya admin tarafından açılan görevler burada görünür." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
