import { PageHeader } from "@/components/dashboard/page-header";
import { TeamMemberForm } from "@/components/team/team-member-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";

export default async function NewTeamMemberPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Yeni çalışan"
        description="Firebase Auth kullanıcısı ve Firestore Alceix profili güvenli server action ile oluşturulur."
      />

      <Card>
        <CardHeader>
          <CardTitle>Çalışan profili</CardTitle>
          <CardDescription>Rol, hedef ve prim bilgilerini net girin; sonradan admin panelinden güncellenebilir.</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamMemberForm />
        </CardContent>
      </Card>
    </div>
  );
}
