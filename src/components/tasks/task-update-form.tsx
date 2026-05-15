"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { updateTaskAction } from "@/lib/actions/tasks";
import {
  PRODUCT_OPTIONS,
  PRODUCTION_STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS,
} from "@/lib/constants";
import type { AppUser, Firm, ProductionTask } from "@/lib/types";

export function TaskUpdateForm({
  task,
  firms,
  users,
  isAdmin,
}: {
  task: ProductionTask;
  firms: Firm[];
  users: AppUser[];
  isAdmin: boolean;
}) {
  const [state, action] = useActionState(updateTaskAction, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="task_id" value={task.id} />

      {isAdmin ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="title">Görev başlığı</Label>
            <Input id="title" name="title" defaultValue={task.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firm_id">Müşteri</Label>
            <Select id="firm_id" name="firm_id" defaultValue={task.firm_id}>
              {firms.map((firm) => (
                <option key={firm.id} value={firm.id}>
                  {firm.company_name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service_type">Hizmet</Label>
              <Select id="service_type" name="service_type" defaultValue={task.service_type}>
                {PRODUCT_OPTIONS.map((product) => (
                  <option key={product.value} value={product.value}>
                    {product.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Atanan</Label>
              <Select id="assigned_to" name="assigned_to" defaultValue={task.assigned_to ?? ""}>
                <option value="">Atanmamış</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priority">Öncelik</Label>
              <Select id="priority" name="priority" defaultValue={task.priority}>
                {TASK_PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Teslim tarihi</Label>
              <Input id="due_date" name="due_date" type="datetime-local" />
            </div>
          </div>
        </>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="status">Durum</Label>
        <Select id="status" name="status" defaultValue={task.status}>
          {PRODUCTION_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
      </div>
      {isAdmin ? (
        <div className="space-y-2">
          <Label htmlFor="description">Açıklama</Label>
          <Textarea id="description" name="description" defaultValue={task.description ?? ""} />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="note">Not</Label>
        <Textarea id="note" name="note" defaultValue={task.note ?? ""} />
      </div>
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton>Görevi Güncelle</SubmitButton>
    </form>
  );
}
