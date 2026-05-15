import { PageHeader } from "@/components/dashboard/page-header";
import { TaskCreateForm } from "@/components/tasks/task-create-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PRODUCTION_ROLES } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import { loadCrmDataset } from "@/lib/repository";

export default async function NewTaskPage() {
  const user = await requireAdmin();
  const dataset = await loadCrmDataset(user);
  const productionUsers = dataset.users.filter((item) =>
    item.role.some((role) => PRODUCTION_ROLES.includes(role)),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasyon"
        title="Yeni görev"
        description="Müşteriye hizmet bazlı üretim görevi aç ve çalışana ata."
      />

      <Card>
        <CardHeader>
          <CardTitle>Görev bilgileri</CardTitle>
          <CardDescription>Başlık, müşteri, hizmet, öncelik ve teslim tarihini net girin.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskCreateForm firms={dataset.firms} users={productionUsers} />
        </CardContent>
      </Card>
    </div>
  );
}
