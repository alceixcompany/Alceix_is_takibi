import { PageHeader } from "@/components/dashboard/page-header";
import { ImportCsvCard } from "@/components/firms/import-csv-card";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";

export default async function ImportFirmsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Toplu veri"
        title="CSV ile firma yükle"
        description="Header isimleri eşleştiğinde firmalar tek seferde içe aktarılır."
      />
      <Card>
        <CardContent className="p-6">
          <ImportCsvCard />
        </CardContent>
      </Card>
    </div>
  );
}
