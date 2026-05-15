import { PageHeader } from "@/components/dashboard/page-header";
import { FirmCreateForm } from "@/components/firms/firm-create-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { loadCrmDataset } from "@/lib/repository";

export default async function NewFirmPage() {
  const user = await requireAdmin();
  const dataset = await loadCrmDataset(user);
  const assignableUsers = dataset.users.filter((item) => item.active && item.role.includes("sales"));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin aracı"
        title="Yeni firma ekle"
        description="Tekil firma ekleme formu ile satış havuzunu güncelle."
      />
      <Card>
        <CardContent className="p-6">
          <FirmCreateForm users={assignableUsers} />
        </CardContent>
      </Card>
    </div>
  );
}
