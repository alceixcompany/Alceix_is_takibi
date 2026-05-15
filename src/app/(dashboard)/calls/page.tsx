import { endOfDay, parseISO, startOfDay } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { CallQuickActions } from "@/components/firms/call-quick-actions";
import { FirmStatusBadge } from "@/components/firms/firm-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCallCountToday } from "@/lib/analytics";
import { hasAnyRole, hasRole, requireUser } from "@/lib/auth";
import { FIRM_STATUS_OPTIONS } from "@/lib/constants";
import { loadCrmDataset } from "@/lib/repository";
import type { Firm } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const followUpStatuses = [
  "aranacak",
  "atanmis",
  "yeni",
  "whatsapp_atildi",
  "odeme_bekleniyor",
];

function isBeforeOrToday(value: string | null, now = new Date()) {
  if (!value) return false;

  return parseISO(value).getTime() <= endOfDay(now).getTime();
}

function isOverdue(value: string | null, now = new Date()) {
  if (!value) return false;

  return parseISO(value).getTime() < startOfDay(now).getTime();
}

function filterCallFirms(
  firms: Firm[],
  filters: {
    query?: string;
    status?: string;
    assignedTo?: string;
    city?: string;
    view?: string;
  },
) {
  const query = filters.query?.trim().toLocaleLowerCase("tr-TR");
  const view = filters.view ?? "followups";

  return firms.filter((firm) => {
    const matchesQuery =
      !query ||
      [firm.company_name, firm.phone, firm.instagram]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase("tr-TR").includes(query));
    const matchesStatus = !filters.status || firm.status === filters.status;
    const matchesAssignee = !filters.assignedTo || firm.assigned_to === filters.assignedTo;
    const matchesCity = !filters.city || firm.city === filters.city;
    const matchesView =
      view === "all" ||
      (view === "followups" && followUpStatuses.includes(firm.status)) ||
      (view === "today" && isBeforeOrToday(firm.next_follow_up_at)) ||
      (view === "overdue" && isOverdue(firm.next_follow_up_at)) ||
      (view === "unreachable" && firm.status === "ulasilamadi") ||
      (view === "interested" &&
        ["ilgilendi", "teklif_verildi", "odeme_bekleniyor"].includes(firm.status));

    return matchesQuery && matchesStatus && matchesAssignee && matchesCity && matchesView;
  });
}

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    assignedTo?: string;
    city?: string;
    view?: string;
  }>;
}) {
  const user = await requireUser();

  if (!hasAnyRole(user, ["admin", "sales"])) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const dataset = await loadCrmDataset(user);
  const isAdmin = hasRole(user, "admin");
  const userMap = new Map(dataset.users.map((item) => [item.id, item]));
  const salesUsers = dataset.users.filter((item) => item.role.includes("sales"));
  const cityOptions = [...new Set(dataset.firms.map((firm) => firm.city).filter(Boolean))].sort();
  const firms = filterCallFirms(dataset.firms, params).sort((a, b) => {
    const aDate = a.next_follow_up_at ?? a.updated_at;
    const bDate = b.next_follow_up_at ?? b.updated_at;

    return aDate.localeCompare(bDate);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Satış takibi"
        title="Aranacaklar"
        description="Satışçı telefon başındayken müşteriyi görür, tek tıkla sonucu işler."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Aranacak kayıt" value={String(firms.length)} detail="Mevcut filtre sonucu" />
        <StatCard
          label="Bugünkü aramam"
          value={String(getCallCountToday(dataset.activities, user.id))}
          detail="Bugün işlenen call aktiviteleri"
          accent="sky"
        />
        <StatCard
          label="Bugün takip"
          value={String(dataset.firms.filter((firm) => isBeforeOrToday(firm.next_follow_up_at)).length)}
          detail="Takip tarihi bugün/geçmiş"
          accent="amber"
        />
        <StatCard
          label="Ulaşılamayan"
          value={String(dataset.firms.filter((firm) => firm.status === "ulasilamadi").length)}
          detail="Tekrar denenecek kayıtlar"
          accent="indigo"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto]">
            <Input name="q" defaultValue={params.q ?? ""} placeholder="Firma, telefon veya instagram ara" />
            <Select name="view" defaultValue={params.view ?? "followups"}>
              <option value="followups">Aranacaklar</option>
              <option value="today">Bugün aranacaklar</option>
              <option value="overdue">Geciken takipler</option>
              <option value="unreachable">Ulaşılamayanlar</option>
              <option value="interested">İlgilenenler</option>
              <option value="all">Tüm kayıtlar</option>
            </Select>
            <Select name="status" defaultValue={params.status ?? ""}>
              <option value="">Tüm durumlar</option>
              {FIRM_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
            <Select name="assignedTo" defaultValue={params.assignedTo ?? ""} disabled={!isAdmin}>
              <option value="">Tüm satışçılar</option>
              {salesUsers.map((salesUser) => (
                <option key={salesUser.id} value={salesUser.id}>
                  {salesUser.name}
                </option>
              ))}
            </Select>
            <Select name="city" defaultValue={params.city ?? ""}>
              <option value="">Tüm şehirler</option>
              {cityOptions.map((city) => (
                <option key={city} value={city ?? ""}>
                  {city}
                </option>
              ))}
            </Select>
            <Button type="submit">Uygula</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:hidden">
        {firms.length ? (
          firms.map((firm) => (
            <div key={firm.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/firms/${firm.id}`} className="font-semibold text-foreground hover:text-primary">
                    {firm.company_name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{firm.city ?? "-"} / {firm.district ?? "-"}</p>
                </div>
                <FirmStatusBadge status={firm.status} />
              </div>
              <div className="mt-3 grid gap-2 text-sm">
                <p><span className="text-muted-foreground">Telefon:</span> {firm.phone ?? "-"}</p>
                <p><span className="text-muted-foreground">Instagram:</span> {firm.instagram ?? "-"}</p>
                <p><span className="text-muted-foreground">Son arama:</span> {formatDateTime(firm.last_called_at)}</p>
                <p><span className="text-muted-foreground">Takip:</span> {formatDateTime(firm.next_follow_up_at)}</p>
                <p><span className="text-muted-foreground">Satışçı:</span> {firm.assigned_to ? userMap.get(firm.assigned_to)?.name ?? "-" : "Atanmadı"}</p>
                <p><span className="text-muted-foreground">Not:</span> {firm.note ?? "-"}</p>
              </div>
              <div className="mt-4">
                <CallQuickActions firmId={firm.id} />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-border bg-white p-4">
            <EmptyState title="Aranacak müşteri yok" description="Filtreyi değiştirerek diğer satış takip kayıtlarına bakabilirsin." />
          </div>
        )}
      </div>

      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle>Aranacak müşteri listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {firms.length ? (
            <Table className="min-w-[1280px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Firma</TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead>İl / İlçe</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Takip</TableHead>
                  <TableHead>Satışçı</TableHead>
                  <TableHead>Not</TableHead>
                  <TableHead>Hızlı işlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {firms.map((firm) => (
                  <TableRow key={firm.id}>
                    <TableCell>
                      <Link href={`/firms/${firm.id}`} className="font-semibold text-foreground hover:text-primary">
                        {firm.company_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{firm.phone ?? "-"}</p>
                        <p className="text-xs text-muted-foreground">{firm.instagram ?? "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{firm.city ?? "-"} / {firm.district ?? "-"}</TableCell>
                    <TableCell><FirmStatusBadge status={firm.status} /></TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{formatDateTime(firm.last_called_at)}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(firm.next_follow_up_at)}</p>
                      </div>
                    </TableCell>
                    <TableCell>{firm.assigned_to ? userMap.get(firm.assigned_to)?.name ?? "-" : "Atanmadı"}</TableCell>
                    <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                      <p className="line-clamp-3 break-words">{firm.note ?? "-"}</p>
                    </TableCell>
                    <TableCell className="w-[520px] min-w-[520px] max-w-[520px]">
                      <CallQuickActions firmId={firm.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="Aranacak müşteri yok" description="Filtreyi değiştirerek diğer satış takip kayıtlarına bakabilirsin." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
