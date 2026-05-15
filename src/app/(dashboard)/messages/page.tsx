import { PageHeader } from "@/components/dashboard/page-header";
import { MessageCreateForm, MessageReplyForm } from "@/components/messages/message-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { hasRole, requireUser } from "@/lib/auth";
import { loadCrmDataset } from "@/lib/repository";
import { formatDateTime } from "@/lib/utils";

const STATUS_LABELS = {
  open: "Açık",
  answered: "Cevaplandı",
  closed: "Kapandı",
} as const;

const STATUS_CLASS = {
  open: "bg-amber-100 text-amber-900 border-amber-200",
  answered: "bg-emerald-100 text-emerald-900 border-emerald-200",
  closed: "bg-slate-100 text-slate-800 border-slate-200",
} as const;

export default async function MessagesPage() {
  const user = await requireUser();
  const isAdmin = hasRole(user, "admin");
  const dataset = await loadCrmDataset(user);
  const messages = dataset.messages;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="İç iletişim"
        title="Admin mesajları"
        description={
          isAdmin
            ? "Çalışanlardan gelen sistem içi talepleri buradan takip et ve yanıtla."
            : "Müşteri, görev veya panelle ilgili notunu doğrudan admine gönder."
        }
      />

      {!isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Yeni mesaj gönder</CardTitle>
            <CardDescription>Bu alan çalışanların admine hızlı not göndermesi içindir.</CardDescription>
          </CardHeader>
          <CardContent>
            <MessageCreateForm />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? "Gelen mesajlar" : "Mesajlarım"}</CardTitle>
          <CardDescription>Durumlar: açık, cevaplandı, kapandı.</CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length ? (
            <div className="grid gap-4">
              {messages.map((message) => (
                <article key={message.id} className="rounded-3xl border border-border bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={STATUS_CLASS[message.status]}>{STATUS_LABELS[message.status]}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDateTime(message.created_at)}</span>
                      </div>
                      <h2 className="text-lg font-bold text-foreground break-words">{message.subject}</h2>
                      <p className="text-sm text-muted-foreground break-words">
                        {message.user_name} · {message.user_email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-muted/40 p-4 text-sm leading-6 text-foreground break-words">
                    {message.message}
                  </div>

                  {message.reply ? (
                    <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950 break-words">
                      <p className="mb-1 font-semibold">Admin cevabı</p>
                      {message.reply}
                    </div>
                  ) : null}

                  {isAdmin ? <div className="mt-4"><MessageReplyForm message={message} /></div> : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Mesaj yok" description="Henüz sistem içi mesaj oluşturulmadı." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
