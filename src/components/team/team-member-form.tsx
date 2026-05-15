"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { createTeamMemberAction } from "@/lib/actions/team";
import { PRODUCT_OPTIONS, ROLE_OPTIONS } from "@/lib/constants";

export function TeamMemberForm() {
  const [state, action] = useActionState(createTeamMemberAction, {});

  return (
    <form action={action} className="grid min-w-0 gap-5 lg:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Ad soyad</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" name="phone" />
      </div>
      <div className="space-y-2 lg:col-span-2">
        <Label>Roller</Label>
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {ROLE_OPTIONS.map((role) => (
            <label key={role.value} className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                name="roles"
                value={role.value}
                className="size-4 rounded border border-border text-primary focus:ring-primary/20"
              />
              {role.label}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="monthly_target">Aylık hedef</Label>
        <Input id="monthly_target" name="monthly_target" type="number" min="0" defaultValue="0" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="target_product_type">Hedef hizmet</Label>
        <Select id="target_product_type" name="target_product_type" defaultValue="">
          <option value="">Genel hedef</option>
          {PRODUCT_OPTIONS.map((product) => (
            <option key={product.value} value={product.value}>
              {product.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="commission_rate">Prim oranı (%)</Label>
        <Input id="commission_rate" name="commission_rate" type="number" min="0" step="0.1" defaultValue="0" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Geçici parola</Label>
        <Input id="password" name="password" placeholder="Boşsa Demo1234!" />
      </div>
      <div className="flex items-end">
        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="active"
            defaultChecked
            className="size-4 rounded border border-border text-primary focus:ring-primary/20"
          />
          Aktif çalışan
        </label>
      </div>
      <div className="space-y-3 lg:col-span-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Çalışan seçtiğin rollerle oluşturulur. Service Account olmasa bile e-posta/parola ile Firebase Auth hesabı açmayı dener.
        </div>
        <FormMessage error={state.error} success={state.success} />
        <SubmitButton>Çalışanı Oluştur</SubmitButton>
      </div>
    </form>
  );
}
