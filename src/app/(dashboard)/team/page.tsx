import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { TeamTable } from "@/components/team/team-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAdmin } from "@/lib/auth";
import { loadCrmDataset } from "@/lib/repository";

export default async function TeamPage() {
  const user = await requireAdmin();
  const dataset = await loadCrmDataset(user);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Ekip yönetimi"
        description="Çalışan rolleri, hedefleri, satış primi ve üretim görev yükü."
        actions={
          <Button asChild>
            <Link href="/team/new">Yeni Çalışan</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-6">
          {dataset.users.length ? (
            <TeamTable users={dataset.users} tasks={dataset.productionTasks} dataset={dataset} />
          ) : (
            <EmptyState title="Çalışan yok" description="Yeni çalışan eklediğinizde burada listelenir." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
