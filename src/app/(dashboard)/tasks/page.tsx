import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProductionTaskTable } from "@/components/production/production-task-table";
import { TaskCreateForm } from "@/components/tasks/task-create-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { hasRole, requireUser } from "@/lib/auth";
import { PRODUCT_OPTIONS, PRODUCTION_ROLES, PRODUCTION_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from "@/lib/constants";
import { loadCrmDataset } from "@/lib/repository";
import type { ProductionTask, ProductionTaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const taskSegments: Array<{ key: string; label: string; description: string; statuses?: ProductionTaskStatus[] }> = [
  { key: "all", label: "Tüm görevler", description: "Bütün üretim kayıtları" },
  { key: "pool", label: "Havuzda bekleyen", description: "Developer seçsin diye açık işler", statuses: ["todo"] },
  { key: "active", label: "Devam eden", description: "Üretimde olan işler", statuses: ["in_progress", "waiting_client", "revision"] },
  { key: "ready", label: "Teslim bekleyen", description: "Kontrol / teslim edilecek", statuses: ["ready_to_deliver"] },
  { key: "delivered", label: "Teslim edilen", description: "Kapanan işler", statuses: ["done"] },
  { key: "cancelled", label: "İptal", description: "İptal görevler", statuses: ["cancelled"] },
];

function applySegment(tasks: ProductionTask[], segmentKey?: string) {
  const segment = taskSegments.find((item) => item.key === segmentKey);
  if (!segment || !segment.statuses) return tasks;
  return tasks.filter((task) => segment.statuses?.includes(task.status));
}

function qs(input: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const value = params.toString();
  return value ? `?${value}` : "";
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; status?: string; priority?: string; assignee?: string; segment?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const dataset = await loadCrmDataset(user);
  const isAdmin = hasRole(user, "admin");
  const canEditOwn = user.role.some((role) => PRODUCTION_ROLES.includes(role));
  const productionUsers = dataset.users.filter((item) =>
    item.role.some((role) => PRODUCTION_ROLES.includes(role)),
  );
  const filtered = dataset.productionTasks.filter((task) => {
    const serviceMatch = !params.service || task.service_type === params.service;
    const statusMatch = !params.status || task.status === params.status;
    const priorityMatch = !params.priority || task.priority === params.priority;
    const assigneeMatch = !params.assignee || task.assigned_to === params.assignee;

    return serviceMatch && statusMatch && priorityMatch && assigneeMatch;
  });
  const tasks = applySegment(filtered, params.segment);
  const activeSegment = params.segment ?? "all";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasyon"
        title="Tüm görevler"
        description="Üretim havuzu ayrı, tüm görev arşivi ayrı. Teslim bekleyen ve teslim edilen işler kendi pencerelerinde kalır."
        actions={
          <div className="flex gap-2">
            {isAdmin ? (
              <Button asChild>
                <Link href="/tasks/new">Yeni Görev</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/production">Üretim Havuzu</Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Görev pencereleri</CardTitle>
          <CardDescription>Havuz, aktif işler, teslim bekleyenler ve teslim edilenler ayrı tutulur.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="segment-scroll">
            {taskSegments.map((segment) => {
              const count = applySegment(dataset.productionTasks, segment.key).length;
              const active = activeSegment === segment.key;
              return (
                <Link
                  key={segment.key}
                  href={`/tasks${qs({ segment: segment.key === "all" ? undefined : segment.key, service: params.service, status: params.status, priority: params.priority, assignee: params.assignee })}`}
                  className={cn(
                    "segment-card rounded-2xl border p-4 transition-all",
                    active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-white hover:bg-muted",
                  )}
                >
                  <span className="block text-2xl font-bold">{count}</span>
                  <span className="segment-label mt-1 block font-semibold">{segment.label}</span>
                  <span className={cn("segment-description mt-1 text-xs", active ? "text-white/80" : "text-muted-foreground")}>{segment.description}</span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <input type="hidden" name="segment" value={params.segment ?? ""} />
            <Select name="service" defaultValue={params.service ?? ""}>
              <option value="">Tüm hizmetler</option>
              {PRODUCT_OPTIONS.map((product) => (
                <option key={product.value} value={product.value}>{product.label}</option>
              ))}
            </Select>
            <Select name="status" defaultValue={params.status ?? ""}>
              <option value="">Tüm durumlar</option>
              {PRODUCTION_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </Select>
            <Select name="priority" defaultValue={params.priority ?? ""}>
              <option value="">Tüm öncelikler</option>
              {TASK_PRIORITY_OPTIONS.map((priority) => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </Select>
            <Select name="assignee" defaultValue={params.assignee ?? ""}>
              <option value="">Tüm çalışanlar</option>
              {productionUsers.map((worker) => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
            </Select>
            <Button type="submit">Uygula</Button>
          </form>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Yeni görev</CardTitle>
            <CardDescription>Admin müşteri, hizmet, çalışan ve teslim tarihini belirleyerek görev açabilir.</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskCreateForm firms={dataset.firms} users={productionUsers} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Görev listesi</CardTitle>
          <CardDescription>{tasks.length} görev gösteriliyor.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length ? (
            <ProductionTaskTable
              tasks={tasks}
              firms={dataset.firms}
              users={dataset.users}
              editable={isAdmin || canEditOwn}
            />
          ) : (
            <EmptyState title="Görev bulunamadı" description="Filtreye uygun görev yok veya henüz görev atanmadı." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
