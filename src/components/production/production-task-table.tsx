import Link from "next/link";
import { ProductionStatusBadge } from "@/components/production/production-status-badge";
import { ProductionTaskUpdateForm } from "@/components/production/production-task-update-form";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PRODUCT_META } from "@/lib/constants";
import type { AppUser, Firm, ProductionTask } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function ProductionTaskTable({
  tasks,
  firms,
  users,
  editable = false,
}: {
  tasks: ProductionTask[];
  firms: Firm[];
  users: AppUser[];
  editable?: boolean;
}) {
  const firmMap = new Map(firms.map((firm) => [firm.id, firm]));
  const userMap = new Map(users.map((user) => [user.id, user]));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:hidden">
        {tasks.map((task) => {
          const firm = firmMap.get(task.firm_id);
          const assigned = task.assigned_to ? userMap.get(task.assigned_to)?.name ?? "-" : "Havuzda";
          return (
            <article key={task.id} className="rounded-3xl border border-border bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{firm?.company_name ?? "Firma yok"}</p>
                  <Link href={`/tasks/${task.id}`} className="block text-lg font-bold leading-tight text-foreground hover:text-primary">
                    {task.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">{PRODUCT_META[task.service_type]?.label ?? task.service_type}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <TaskPriorityBadge priority={task.priority} />
                  <ProductionStatusBadge status={task.status} />
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Atanan</dt>
                  <dd className="font-medium text-foreground">{assigned}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Teslim</dt>
                  <dd>{formatDateTime(task.due_date)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Güncellendi</dt>
                  <dd>{formatDateTime(task.updated_at)}</dd>
                </div>
                {task.note ? (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Not</dt>
                    <dd className="break-words">{task.note}</dd>
                  </div>
                ) : null}
              </dl>

              {editable ? <div className="mt-4"><ProductionTaskUpdateForm task={task} /></div> : null}
            </article>
          );
        })}
      </div>

      <div className="hidden xl:block">
        <Table className="min-w-[1180px]">
          <TableHeader>
            <TableRow>
              <TableHead>Firma</TableHead>
              <TableHead>Görev</TableHead>
              <TableHead>Hizmet</TableHead>
              <TableHead>Atanan</TableHead>
              <TableHead>Öncelik</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Teslim</TableHead>
              <TableHead>Güncellendi</TableHead>
              <TableHead className="w-[22rem]">Aksiyon</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{firmMap.get(task.firm_id)?.company_name ?? "-"}</TableCell>
                <TableCell>
                  <Link href={`/tasks/${task.id}`} className="font-semibold text-foreground hover:text-primary">
                    {task.title}
                  </Link>
                </TableCell>
                <TableCell>{PRODUCT_META[task.service_type]?.label ?? task.service_type}</TableCell>
                <TableCell>{task.assigned_to ? userMap.get(task.assigned_to)?.name ?? "-" : "Havuzda"}</TableCell>
                <TableCell><TaskPriorityBadge priority={task.priority} /></TableCell>
                <TableCell><ProductionStatusBadge status={task.status} /></TableCell>
                <TableCell>{formatDateTime(task.due_date)}</TableCell>
                <TableCell>{formatDateTime(task.updated_at)}</TableCell>
                <TableCell className="w-[22rem]">{editable ? <ProductionTaskUpdateForm task={task} /> : task.note ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
