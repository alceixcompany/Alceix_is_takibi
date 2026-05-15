import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { AppUser, CommissionSummary } from "@/lib/types";

export function CommissionTable({
  rows,
}: {
  rows: Array<{
    user: AppUser;
    summary: CommissionSummary;
  }>;
}) {
  return (
    <Table className="min-w-[980px]">
      <TableHeader>
        <TableRow>
          <TableHead>Kullanıcı</TableHead>
          <TableHead>Hedef</TableHead>
          <TableHead>Kesinleşen Satış</TableHead>
          <TableHead>Ciro</TableHead>
          <TableHead>Taban Prim</TableHead>
          <TableHead>Ekstra Prim</TableHead>
          <TableHead>Toplam Prim</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.user.id}>
            <TableCell>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{row.user.name}</p>
                <p className="text-xs text-muted-foreground">{row.user.email}</p>
              </div>
            </TableCell>
            <TableCell>{row.user.monthly_target || "-"}</TableCell>
            <TableCell>{row.summary.confirmedSales}</TableCell>
            <TableCell>{formatCurrency(row.summary.revenue)}</TableCell>
            <TableCell>{formatCurrency(row.summary.baseCommission)}</TableCell>
            <TableCell>{formatCurrency(row.summary.extraCommission)}</TableCell>
            <TableCell className="font-semibold text-foreground">
              {formatCurrency(row.summary.totalCommission)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
