"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { claimProductionTaskAction, updateTaskAction } from "@/lib/actions/tasks";
import { PRODUCTION_STATUS_OPTIONS } from "@/lib/constants";
import type { ProductionTask } from "@/lib/types";

export function ProductionTaskUpdateForm({ task }: { task: ProductionTask }) {
  const [state, action] = useActionState(updateTaskAction, {});
  const [claimState, claimAction] = useActionState(claimProductionTaskAction, {});

  if (!task.assigned_to) {
    return (
      <form action={claimAction} className="min-w-[13rem] max-w-[18rem] rounded-2xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
        <input type="hidden" name="task_id" value={task.id} />
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight text-emerald-950">Havuzda bekliyor</p>
            <p className="mt-1 text-xs leading-snug text-emerald-900">Üzerine alınca iş sana atanır.</p>
          </div>
          <SubmitButton size="sm" className="w-full whitespace-normal leading-tight">İşi Üzerime Al</SubmitButton>
          <FormMessage error={claimState.error} success={claimState.success} />
        </div>
      </form>
    );
  }

  return (
    <form action={action} className="min-w-[15rem] max-w-[22rem] space-y-2 rounded-2xl border border-border bg-white p-3 shadow-sm">
      <input type="hidden" name="task_id" value={task.id} />
      <Select name="status" defaultValue={task.status} className="h-10 text-sm">
        {PRODUCTION_STATUS_OPTIONS.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </Select>
      <Input name="note" defaultValue={task.note ?? ""} placeholder="Görev notu" className="h-10 text-sm" />
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton size="sm" className="w-full">Kaydet</SubmitButton>
    </form>
  );
}
