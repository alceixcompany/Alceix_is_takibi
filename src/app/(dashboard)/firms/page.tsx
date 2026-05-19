import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { FirmTable } from "@/components/firms/firm-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { filterFirms } from "@/lib/analytics";
import { hasAnyRole, hasRole, requireUser } from "@/lib/auth";
import { FIRM_STATUS_OPTIONS } from "@/lib/constants";
import { loadCrmDataset } from "@/lib/repository";
import type { Firm, FirmStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const firmSegments: Array<{ key: string; label: string; description: string; statuses?: FirmStatus[] }> = [
  { key: "all", label: "Tüm müşteriler", description: "Tüm firma havuzu" },
  { key: "not_called", label: "Aranmayanlar", description: "Yeni, atanmış ve aranacak kayıtlar", statuses: ["yeni", "atanmis", "aranacak"] },
  { key: "called", label: "Arananlar", description: "Arandı ve ilgilenenler", statuses: ["arandi", "ilgilendi", "teklif_verildi"] },
  { key: "unreachable", label: "Ulaşılamayan", description: "Tekrar takip edilecek", statuses: ["ulasilamadi"] },
  { key: "payment", label: "Ödeme bekleyen", description: "Tahsilat aşaması", statuses: ["odeme_bekleniyor"] },
  { key: "production", label: "Üretimde", description: "Ödeme alındı / üretime aktarıldı", statuses: ["odeme_alindi", "uretime_aktarildi"] },
  { key: "delivered", label: "Teslim edilen", description: "İşi kapanan müşteriler", statuses: ["teslim_edildi"] },
];

function applySegment(firms: Firm[], segmentKey?: string) {
  const segment = firmSegments.find((item) => item.key === segmentKey);
  if (!segment || !segment.statuses) return firms;
  return firms.filter((firm) => segment.statuses?.includes(firm.status));
}

function qs(input: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const value = params.toString();
  return value ? `?${value}` : "";
}

export default async function FirmsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; segment?: string; page?: string }>;
}) {
  const user = await requireUser();

  if (!hasAnyRole(user, ["admin", "sales"])) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const dataset = await loadCrmDataset(user);
  const statusFiltered = filterFirms(dataset.firms, {
    query: params.q,
    status: params.status,
  });
  const firms = applySegment(statusFiltered, params.segment);
  const activeSegment = params.segment ?? "all";
  const pageSize = 25;
  const totalFirms = firms.length;
  const totalPages = Math.max(1, Math.ceil(totalFirms / pageSize));
  const currentPage = Math.min(
    totalPages,
    Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  );
  const paginatedFirms = firms.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Firma yönetimi"
        title="Müşteri listesi"
        description="Müşterileri durumuna göre ayrı pencerelerde tut: aranmayanlar, ödeme bekleyenler, üretimde ve teslim edilenler."
        actions={
          hasRole(user, "admin") ? (
            <>
              <Button asChild variant="outline">
                <Link href="/firms/import">CSV Yükle</Link>
              </Button>
              <Button asChild>
                <Link href="/firms/new">Yeni Firma</Link>
              </Button>
            </>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Durum pencereleri</CardTitle>
          <CardDescription>Listeyi büyüyünce karışmasın diye ayrı operasyon pencerelerine ayırdık.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="segment-scroll">
            {firmSegments.map((segment) => {
              const count = applySegment(dataset.firms, segment.key).length;
              const active = activeSegment === segment.key;
              return (
                <Link
                  key={segment.key}
                  href={`/firms${qs({ segment: segment.key === "all" ? undefined : segment.key, q: params.q, status: params.status })}`}
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
          <form className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
            <input type="hidden" name="segment" value={params.segment ?? ""} />
            <Input name="q" defaultValue={params.q ?? ""} placeholder="Firma adı, şehir veya telefon ara" />
            <Select name="status" defaultValue={params.status ?? ""}>
              <option value="">Tüm durumlar</option>
              {FIRM_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
            <Button type="submit">Uygula</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste</CardTitle>
          <CardDescription>
            Toplam {totalFirms} kayıt bulundu. Sayfa başına {pageSize} kayıt gösteriliyor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedFirms.length ? (
            <div className="space-y-4">
              <FirmTable firms={paginatedFirms} users={dataset.users} canManage={hasRole(user, "admin")} />
              {totalPages > 1 ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {Math.min((currentPage - 1) * pageSize + 1, totalFirms)} - {Math.min(currentPage * pageSize, totalFirms)} / {totalFirms}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentPage > 1 ? (
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/firms${qs({
                            segment: params.segment,
                            q: params.q,
                            status: params.status,
                            page: String(currentPage - 1),
                          })}`}
                        >
                          Önceki
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        Önceki
                      </Button>
                    )}
                    {pageNumbers.map((page, index) => {
                      const previousPage = pageNumbers[index - 1];
                      const showGap = previousPage && page - previousPage > 1;

                      return (
                        <span key={page} className="flex items-center gap-2">
                          {showGap ? <span className="px-1 text-sm text-muted-foreground">...</span> : null}
                          <Button asChild variant={page === currentPage ? "default" : "outline"} size="sm">
                            <Link
                              href={`/firms${qs({
                                segment: params.segment,
                                q: params.q,
                                status: params.status,
                                page: page > 1 ? String(page) : undefined,
                              })}`}
                            >
                              {page}
                            </Link>
                          </Button>
                        </span>
                      );
                    })}
                    {currentPage < totalPages ? (
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/firms${qs({
                            segment: params.segment,
                            q: params.q,
                            status: params.status,
                            page: String(currentPage + 1),
                          })}`}
                        >
                          Sonraki
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        Sonraki
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState title="Firma bulunamadı" description="Bu pencerede veya filtreye uygun kayıt yok." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
