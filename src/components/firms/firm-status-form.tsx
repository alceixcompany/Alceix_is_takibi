"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { updateFirmStatusAction } from "@/lib/actions/firms";
import { FIRM_STATUS_OPTIONS } from "@/lib/constants";
import type { Firm } from "@/lib/types";

export function FirmStatusForm({ firm }: { firm: Firm }) {
  const [state, action] = useActionState(updateFirmStatusAction, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="firm_id" value={firm.id} />
      <div className="space-y-2">
        <Label htmlFor="status">Durum</Label>
        <Select id="status" name="status" defaultValue={firm.status}>
          {FIRM_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="next_follow_up_at">Sonraki takip</Label>
        <Input id="next_follow_up_at" name="next_follow_up_at" type="datetime-local" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">Durum notu</Label>
        <Textarea id="note" name="note" placeholder="Arama sonucu, teklif notu, takip bilgisi..." />
      </div>
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton>Durumu Güncelle</SubmitButton>
    </form>
  );
}
