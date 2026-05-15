import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { SaleCloseForm } from "@/components/sales/sale-close-form";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { hasAnyRole, hasRole, requireUser } from "@/lib/auth";
import { loadCrmDataset } from "@/lib/repository";

export default async function CloseSalePage() {
  const user = await requireUser();

  if (!hasAnyRole(user, ["admin", "sales"])) {
    redirect("/dashboard");
  }

  const dataset = await loadCrmDataset(user);
  const firms = dataset.firms.filter((firm) => !["kara_liste", "teslim_edildi"].includes(firm.status));
  const salesUsers = dataset.users.filter(
    (item) => item.role.includes("sales") || item.role.includes("admin"),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Satış işlemi"
        title="Satış kapatma ekranı"
        description="Ürün seç, tutarı belirle ve ödeme durumuna göre kaydı kesinleştir."
      />
      <Card>
        <CardContent className="p-6">
          {firms.length ? (
            <SaleCloseForm
              firms={firms}
              salesUsers={salesUsers}
              currentUserId={user.id}
              isAdmin={hasRole(user, "admin")}
            />
          ) : (
            <EmptyState title="Satışa uygun firma yok" description="Önce firmaları ekleyip satışçılara atayın." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
