"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { createTaskAction } from "@/lib/actions/tasks";
import {
  PRODUCT_OPTIONS,
  PRODUCTION_STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS,
} from "@/lib/constants";
import type { AppUser, Firm } from "@/lib/types";

export function TaskCreateForm({
  firms,
  users,
}: {
  firms: Firm[];
  users: AppUser[];
}) {
  const [state, action] = useActionState(createTaskAction, {});

  return (
    <form action={action} className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="title">Görev başlığı</Label>
        <Input id="title" name="title" required placeholder="Örn. Ana sayfa revizyonu" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="firm_id">Müşteri</Label>
        <Select id="firm_id" name="firm_id" required defaultValue={firms[0]?.id}>
          {firms.map((firm) => (
            <option key={firm.id} value={firm.id}>
              {firm.company_name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="service_type">Hizmet tipi</Label>
        <Select id="service_type" name="service_type" defaultValue={PRODUCT_OPTIONS[0]?.value}>
          {PRODUCT_OPTIONS.map((product) => (
            <option key={product.value} value={product.value}>
              {product.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="assigned_to">Atanan çalışan</Label>
        <Select id="assigned_to" name="assigned_to" defaultValue="">
          <option value="">Sonra ata</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="priority">Öncelik</Label>
        <Select id="priority" name="priority" defaultValue="normal">
          {TASK_PRIORITY_OPTIONS.map((priority) => (
            <option key={priority.value} value={priority.value}>
              {priority.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Durum</Label>
        <Select id="status" name="status" defaultValue="todo">
          {PRODUCTION_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="due_date">Teslim tarihi</Label>
        <Input id="due_date" name="due_date" type="datetime-local" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">Kısa not</Label>
        <Input id="note" name="note" placeholder="İç ekip notu" />
      </div>
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea id="description" name="description" placeholder="Görev kapsamı, müşteri beklentisi, teslim kriterleri..." />
      </div>
      <div className="space-y-3 lg:col-span-2">
        <FormMessage error={state.error} success={state.success} />
        <SubmitButton>Görev Oluştur</SubmitButton>
      </div>
    </form>
  );
}
