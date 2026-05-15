"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { FIRM_STATUS_OPTIONS } from "@/lib/constants";
import { createFirmAction } from "@/lib/actions/firms";
import type { AppUser } from "@/lib/types";

export function FirmCreateForm({ users }: { users: AppUser[] }) {
  const [state, action] = useActionState(createFirmAction, {});

  return (
    <form action={action} className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="company_name">Firma adı</Label>
        <Input id="company_name" name="company_name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sector">Sektör</Label>
        <Input id="sector" name="sector" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">Şehir</Label>
        <Input id="city" name="city" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="district">İlçe</Label>
        <Input id="district" name="district" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" name="phone" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="source">Kaynak</Label>
        <Input id="source" name="source" placeholder="Excel, web formu, tavsiye..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" placeholder="https://..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="instagram">Instagram</Label>
        <Input id="instagram" name="instagram" placeholder="@firma" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="assigned_to">Atanan satışçı</Label>
        <Select id="assigned_to" name="assigned_to" defaultValue="">
          <option value="">Şimdilik atama yapma</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Başlangıç durumu</Label>
        <Select id="status" name="status" defaultValue="yeni">
          {FIRM_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="next_follow_up_at">Takip tarihi</Label>
        <Input id="next_follow_up_at" name="next_follow_up_at" type="datetime-local" />
      </div>
      <div className="flex items-end">
        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="has_website"
            className="size-4 rounded border border-border text-primary focus:ring-primary/20"
          />
          Web sitesi var
        </label>
      </div>
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="note">Not</Label>
        <Textarea id="note" name="note" placeholder="İlk arama öncesi önemli notlar..." />
      </div>
      <div className="space-y-3 lg:col-span-2">
        <FormMessage error={state.error} success={state.success} />
        <SubmitButton>Firmayı Kaydet</SubmitButton>
      </div>
    </form>
  );
}
