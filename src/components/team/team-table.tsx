import Link from "next/link";

import { RoleBadges } from "@/components/firms/role-badges";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildEmployeeTaskCounts, getSalesPerformanceStats } from "@/lib/analytics";
import { PRODUCT_META, PRODUCTION_ROLES } from "@/lib/constants";
import type { AppUser, CrmDataset, ProductionTask } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function TeamTable({
  users,
  tasks,
  dataset,
}: {
  users: AppUser[];
  tasks: ProductionTask[];
  dataset: CrmDataset;
}) {
  const salesStats = getSalesPerformanceStats(dataset);

  return (
    <Table className="min-w-[1180px]">
      <TableHeader>
        <TableRow>
          <TableHead>Çalışan</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Aylık hedef</TableHead>
          <TableHead>Satış metrikleri</TableHead>
          <TableHead>Ciro / Prim</TableHead>
          <TableHead>Üretim</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const salesRow = salesStats.find((row) => row.user.id === user.id);
          const taskCounts = buildEmployeeTaskCounts(user, tasks);
          const isSales = user.role.includes("sales");
          const isProducer = user.role.some((role) => PRODUCTION_ROLES.includes(role));

          return (
            <TableRow key={user.id}>
              <TableCell>
                <div className="space-y-1">
                  <Link href={`/team/${user.id}`} className="font-semibold text-foreground hover:text-primary">
                    {user.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.phone ?? "Telefon yok"}</p>
                </div>
              </TableCell>
              <TableCell>
                <RoleBadges roles={user.role} />
              </TableCell>
              <TableCell>
                <Badge className={user.active ? "border bg-emerald-100 text-emerald-900" : "border bg-slate-100 text-slate-700"}>
                  {user.active ? "Aktif" : "Pasif"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p>{user.monthly_target}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.target_product_type ? PRODUCT_META[user.target_product_type]?.label : "Genel"}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {isSales ? (
                  <div className="space-y-1">
                    <p>{salesRow?.assignedCustomers ?? 0} atanan / {salesRow?.totalCalledCustomers ?? 0} aranan</p>
                    <p className="text-xs text-muted-foreground">
                      {salesRow?.unreachableCustomers ?? 0} ulaşılamadı, {salesRow?.interestedCustomers ?? 0} ilgilendi
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {salesRow?.paymentReceivedCustomers ?? 0} ödeme alındı
                    </p>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {isSales ? (
                  <div className="space-y-1">
                    <p>{formatCurrency(salesRow?.revenue ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(salesRow?.commission ?? 0)} prim</p>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {isProducer ? (
                  <div className="space-y-1">
                    <p>{taskCounts.active} aktif / {taskCounts.total} toplam</p>
                    <p className="text-xs text-muted-foreground">
                      {taskCounts.done} tamamlandı, {taskCounts.overdue} gecikti
                    </p>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
