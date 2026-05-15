"use client";

import { useActionState } from "react";

import { createMessageAction, replyMessageAction } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState, InternalMessage } from "@/lib/types";

const initialState: ActionState = {};

export function MessageCreateForm() {
  const [state, action] = useActionState(createMessageAction, initialState);

  return (
    <form action={action} className="grid gap-3">
      <Input name="subject" placeholder="Konu: örn. Müşteri bilgisi eksik" required />
      <Textarea name="message" rows={5} placeholder="Admine iletmek istediğin notu yaz..." required />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FormMessage error={state.error} success={state.success} />
        <SubmitButton>Admine Gönder</SubmitButton>
      </div>
    </form>
  );
}

export function MessageReplyForm({ message }: { message: InternalMessage }) {
  const [state, action] = useActionState(replyMessageAction, initialState);

  return (
    <form action={action} className="grid gap-3 rounded-2xl border border-border/80 bg-muted/30 p-3">
      <input type="hidden" name="message_id" value={message.id} />
      <Textarea name="reply" rows={3} placeholder="Admin cevabı" defaultValue={message.reply ?? ""} />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Select name="status" defaultValue={message.status}>
          <option value="open">Açık</option>
          <option value="answered">Cevaplandı</option>
          <option value="closed">Kapandı</option>
        </Select>
        <Button type="submit">Güncelle</Button>
      </div>
      <FormMessage error={state.error} success={state.success} />
    </form>
  );
}
