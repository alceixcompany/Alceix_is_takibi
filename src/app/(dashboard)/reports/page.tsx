import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  filterDatasetForReports,
  getFirmStatusReportRows,
  getProductionReportRows,
  getReportSummary,
  getSalesPerformanceStats,
  getServiceReportRows,
} from "@/lib/analytics";
import { hasAnyRole, hasRole, requireUser } from "@/lib/auth";
import { FIRM_STATUS_OPTIONS, PRODUCT_OPTIONS } from "@/lib/constants";
import { loadCrmDataset } from "@/lib/repository";
import { formatCurrency } from "@/lib/utils";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    salesUserId?: string;
    serviceType?: string;
    firmStatus?: string;
    paymentStatus?: string;
  }>;
}) {
  const user = await requireUser();

  if (!hasAnyRole(user, ["admin", "sales"])) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const exportQuery = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      exportQuery.set(key, value);
    }
  });

  const dataset = await loadCrmDataset(user);
  const isAdmin = hasRole(user, "admin");
  const salesUsers = dataset.users.filter((item) => item.role.includes("sales"));
  const filteredDataset = filterDatasetForReports(dataset, {
    dateFrom: params.from,
    dateTo: params.to,
    salesUserId: isAdmin ? params.salesUserId : user.id,
    serviceType: params.serviceType,
    firmStatus: params.firmStatus,
    paymentStatus: params.paymentStatus,
  });
  const summary = getReportSummary(filteredDataset);
  const salesStats = getSalesPerformanceStats(filteredDataset);
  const serviceRows = getServiceReportRows(filteredDataset);
  const statusRows = getFirmStatusReportRows(filteredDataset);
  const productionRows = getProductionReportRows(filteredDataset);
  const userMap = new Map(dataset.users.map((item) => [item.id, item]));
  const firmMap = new Map(dataset.firms.map((item) => [item.id, item]));
  const callHistoryRows = filteredDataset.activities
    .filter((activity) => ["call", "whatsapp", "sale", "payment", "status_change"].includes(activity.type))
    .slice(0, 80);
  const excelQuery = new URLSearchParams(exportQuery);
  const pdfQuery = new URLSearchParams(exportQuery);
  const csvQuery = new URLSearchParams(exportQuery);

  excelQuery.set("format", "excel");
  pdfQuery.set("format", "pdf");
  csvQuery.set("format", "csv");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <PageHeader
          eyebrow="Raporlar"
          title={isAdmin ? "Alceix performans raporu" : "Raporlarım"}
          description="Satış, hizmet, müşteri durumu ve üretim performansını tek ekranda izle."
        />
        <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/reports/export?${excelQuery.toString()}`}>Excel indir</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/reports/export?${csvQuery.toString()}`}>CSV indir</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/reports/export?${pdfQuery.toString()}`}>PDF indir</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto]">
            <Input name="from" type="date" defaultValue={params.from ?? ""} />
            <Input name="to" type="date" defaultValue={params.to ?? ""} />
            <Select name="salesUserId" defaultValue={isAdmin ? params.salesUserId ?? "" : user.id} disabled={!isAdmin}>
              <option value="">Tüm satışçılar</option>
              {salesUsers.map((salesUser) => (
                <option key={salesUser.id} value={salesUser.id}>
                  {salesUser.name}
                </option>
              ))}
            </Select>
            <Select name="serviceType" defaultValue={params.serviceType ?? ""}>
              <option value="">Tüm hizmetler</option>
              {PRODUCT_OPTIONS.map((product) => (
                <option key={product.value} value={product.value}>
                  {product.label}
                </option>
              ))}
            </Select>
            <Select name="firmStatus" defaultValue={params.firmStatus ?? ""}>
              <option value="">Tüm müşteri durumları</option>
              {FIRM_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
            <Select name="paymentStatus" defaultValue={params.paymentStatus ?? ""}>
              <option value="">Tüm ödeme durumları</option>
              <option value="pending">Ödeme bekleniyor</option>
              <option value="paid">Ödeme alındı</option>
            </Select>
            <Button type="submit">Uygula</Button>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam müşteri" value={String(summary.totalCustomers)} detail="Filtrelenen kayıtlar" />
        <StatCard label="Aranan müşteri" value={String(summary.totalCalledCustomers)} detail="Tekil call aktivitesi" accent="sky" />
        <StatCard label="Ulaşılamayan" value={String(summary.totalUnreachable)} detail="Status: ulaşılamadı" accent="amber" />
        <StatCard label="İlgilenen" value={String(summary.totalInterested)} detail="Sıcak müşteri" accent="indigo" />
        <StatCard label="Teklif verilen" value={String(summary.totalOffered)} detail="Teklif aşaması" />
        <StatCard label="Ödeme bekleyen" value={String(summary.totalPaymentPending)} detail="Tahsilat takibi" accent="sky" />
        <StatCard label="Ödeme alınan" value={String(summary.totalPaymentReceived)} detail="Kapanan müşteri" accent="amber" />
        <StatCard label="Toplam ciro" value={formatCurrency(summary.revenue)} detail="Paid satışlar" accent="indigo" />
        <StatCard label="Toplam prim" value={formatCurrency(summary.commission)} detail="Satışçı hak edişi" />
        <StatCard label="Aktif üretim işi" value={String(summary.activeTasks)} detail="Todo/devam/revizyon" accent="sky" />
        <StatCard label="Geciken üretim" value={String(summary.overdueTasks)} detail="Teslim tarihi geçti" accent="amber" />
        <StatCard label="Tamamlanan iş" value={String(summary.completedTasks)} detail="Done görevler" accent="indigo" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Satışçı raporu</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow>
                <TableHead>Satışçı</TableHead>
                <TableHead>Atanan</TableHead>
                <TableHead>Aranan</TableHead>
                <TableHead>Ulaşılamayan</TableHead>
                <TableHead>İlgilenen</TableHead>
                <TableHead>Teklif</TableHead>
                <TableHead>Ödeme bekleyen</TableHead>
                <TableHead>Ödeme alınan</TableHead>
                <TableHead>Ciro</TableHead>
                <TableHead>Prim</TableHead>
                <TableHead>Dönüşüm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesStats.map((row) => (
                <TableRow key={row.user.id}>
                  <TableCell>{row.user.name}</TableCell>
                  <TableCell>{row.assignedCustomers}</TableCell>
                  <TableCell>{row.totalCalledCustomers}</TableCell>
                  <TableCell>{row.unreachableCustomers}</TableCell>
                  <TableCell>{row.interestedCustomers}</TableCell>
                  <TableCell>{row.offeredCustomers}</TableCell>
                  <TableCell>{row.paymentPendingCustomers}</TableCell>
                  <TableCell>{row.paymentReceivedCustomers}</TableCell>
                  <TableCell>{formatCurrency(row.revenue)}</TableCell>
                  <TableCell>{formatCurrency(row.commission)}</TableCell>
                  <TableCell>{formatPercent(row.conversionRate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hizmet raporu</CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Hizmet</TableHead>
                  <TableHead>Satış</TableHead>
                  <TableHead>Ciro</TableHead>
                  <TableHead>Ortalama</TableHead>
                  <TableHead>Bekleyen</TableHead>
                  <TableHead>Alınan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceRows.map((row) => (
                  <TableRow key={row.service.value}>
                    <TableCell>{row.service.label}</TableCell>
                    <TableCell>{row.salesCount}</TableCell>
                    <TableCell>{formatCurrency(row.revenue)}</TableCell>
                    <TableCell>{formatCurrency(row.averageSaleAmount)}</TableCell>
                    <TableCell>{formatCurrency(row.pendingAmount)}</TableCell>
                    <TableCell>{formatCurrency(row.paidAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Durum raporu</CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Durum</TableHead>
                  <TableHead>Adet</TableHead>
                  <TableHead>Oran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusRows.map((row) => (
                  <TableRow key={row.status.value}>
                    <TableCell>{row.status.label}</TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell>{formatPercent(row.ratio)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Kim hangi firmayı aradı?</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Satışçı</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>İşlem</TableHead>
                <TableHead>Not</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {callHistoryRows.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{new Date(activity.created_at).toLocaleString("tr-TR")}</TableCell>
                  <TableCell>{activity.user_id ? userMap.get(activity.user_id)?.name ?? "Bilinmiyor" : "Sistem"}</TableCell>
                  <TableCell>{firmMap.get(activity.firm_id)?.company_name ?? "Silinmiş firma"}</TableCell>
                  <TableCell>{activity.type}</TableCell>
                  <TableCell>{activity.note ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Üretim raporu</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow>
                <TableHead>Çalışan</TableHead>
                <TableHead>Atanan</TableHead>
                <TableHead>Devam eden</TableHead>
                <TableHead>Revizyon</TableHead>
                <TableHead>Müşteri bekliyor</TableHead>
                <TableHead>Tamamlanan</TableHead>
                <TableHead>Geciken</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionRows.map((row) => (
                <TableRow key={row.user.id}>
                  <TableCell>{row.user.name}</TableCell>
                  <TableCell>{row.assigned}</TableCell>
                  <TableCell>{row.inProgress}</TableCell>
                  <TableCell>{row.revision}</TableCell>
                  <TableCell>{row.waitingClient}</TableCell>
                  <TableCell>{row.done}</TableCell>
                  <TableCell>{row.overdue}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
