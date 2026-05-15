import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { FirmTable } from "@/components/firms/firm-table";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { hasRole, requireUser } from "@/lib/auth";
import { loadCrmDataset } from "@/lib/repository";

export default async function AssignedPage() {
  const user = await requireUser();

  if (!hasRole(user, "sales")) {
    redirect("/dashboard");
  }

  const dataset = await loadCrmDataset(user);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Satışçı görünümü"
        title="Bana atanan firmalar"
        description="Yalnızca sana atanmış kayıtlar listelenir."
      />
      <Card>
        <CardContent className="p-6">
          {dataset.firms.length ? (
            <FirmTable firms={dataset.firms} users={dataset.users} />
          ) : (
            <EmptyState title="Atanmış firma yok" description="Admin tarafından yeni kayıt atandığında burada görünür." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
