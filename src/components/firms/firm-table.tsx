import Link from "next/link";

import { FirmDeleteForm } from "@/components/firms/firm-delete-form";
import { FirmStatusBadge } from "@/components/firms/firm-status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AppUser, Firm } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function FirmTable({
  firms,
  users,
  canManage = false,
}: {
  firms: Firm[];
  users: AppUser[];
  canManage?: boolean;
}) {
  const userMap = new Map(users.map((user) => [user.id, user]));

  return (
    <Table className="min-w-[1120px]">
      <TableHeader>
        <TableRow>
          <TableHead>Firma</TableHead>
          <TableHead>Şehir</TableHead>
          <TableHead>İletişim</TableHead>
          <TableHead>Atanan</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Son İşlem</TableHead>
          <TableHead>İşlem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {firms.map((firm) => (
          <TableRow key={firm.id}>
            <TableCell>
              <div className="max-w-[240px] space-y-1">
                <Link href={`/firms/${firm.id}`} className="font-semibold text-foreground hover:text-primary">
                  {firm.company_name}
                </Link>
                <p className="text-xs text-muted-foreground">{firm.sector ?? "Sektör belirtilmedi"}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1 text-sm text-foreground">
                <p>{firm.city ?? "Belirtilmedi"}</p>
                <p className="text-xs text-muted-foreground">{firm.district ?? "İlçe yok"}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="max-w-[220px] space-y-1">
                <p>{firm.phone ?? "-"}</p>
                <p className="break-all text-xs text-muted-foreground">{firm.website ?? firm.instagram ?? "Bağlantı yok"}</p>
              </div>
            </TableCell>
            <TableCell>{firm.assigned_to ? userMap.get(firm.assigned_to)?.name ?? "-" : "Atanmadı"}</TableCell>
            <TableCell>
              <FirmStatusBadge status={firm.status} />
            </TableCell>
            <TableCell>{formatDateTime(firm.updated_at)}</TableCell>
            <TableCell>
              <div className="flex min-w-[210px] flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/firms/${firm.id}`}>Detay / Düzenle</Link>
                </Button>
                {canManage ? <FirmDeleteForm firmId={firm.id} compact /> : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
