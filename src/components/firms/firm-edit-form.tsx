"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { FIRM_STATUS_OPTIONS } from "@/lib/constants";
import { editFirmAction } from "@/lib/actions/firms";
import type { AppUser, Firm } from "@/lib/types";

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function FirmEditForm({ firm, users }: { firm: Firm; users: AppUser[] }) {
  const [state, action] = useActionState(editFirmAction, {});

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="firm_id" value={firm.id} />
      <div className="space-y-2">
        <Label htmlFor="edit_company_name">Firma adı</Label>
        <Input id="edit_company_name" name="company_name" defaultValue={firm.company_name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit_sector">Sektör</Label>
        <Input id="edit_sector" name="sector" defaultValue={firm.sector ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit_city">Şehir</Label>
        <Input id="edit_city" name="city" defaultValue={firm.city ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit_district">İlçe</Label>
        <Input id="edit_district" name="district" defaultValue={firm.district ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit_phone">Telefon</Label>
        <Input id="edit_phone" name="phone" defaultValue={firm.phone ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit_instagram">Instagram</Label>
        <Input id="edit_instagram" name="instagram" defaultValue={firm.instagram ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit_website">Website</Label>
        <Input id="edit_website" name="website" defaultValue={firm.website ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit_source">Kaynak</Label>
        <Input id="edit_source" name="source" defaultValue={firm.source ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit_assigned_to">Atanan satışçı</Label>
        <Select id="edit_assigned_to" name="assigned_to" defaultValue={firm.assigned_to ?? ""}>
          <option value="">Atama yok</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit_status">Durum</Label>
        <Select id="edit_status" name="status" defaultValue={firm.status}>
          {FIRM_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit_next_follow_up_at">Takip tarihi</Label>
        <Input id="edit_next_follow_up_at" name="next_follow_up_at" type="datetime-local" defaultValue={toLocalDateTime(firm.next_follow_up_at)} />
      </div>
      <div className="flex items-end">
        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="has_website" defaultChecked={firm.has_website} className="size-4 rounded border border-border text-primary focus:ring-primary/20" />
          Web sitesi var
        </label>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="edit_note">Firma notu</Label>
        <Textarea id="edit_note" name="note" defaultValue={firm.note ?? ""} placeholder="Firma hakkında ana not..." />
      </div>
      <div className="space-y-3 md:col-span-2">
        <FormMessage error={state.error} success={state.success} />
        <SubmitButton>Firma Bilgilerini Güncelle</SubmitButton>
      </div>
    </form>
  );
}
