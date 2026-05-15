"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { addFirmNoteAction } from "@/lib/actions/firms";

export function FirmNoteForm({ firmId }: { firmId: string }) {
  const [state, action] = useActionState(addFirmNoteAction, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="firm_id" value={firmId} />
      <div className="space-y-2">
        <Label htmlFor="note">Yeni not</Label>
        <Textarea id="note" name="note" placeholder="Kısa bir güncelleme bırak..." />
      </div>
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton variant="secondary">Not Ekle</SubmitButton>
    </form>
  );
}
