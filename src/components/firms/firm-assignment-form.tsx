"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateFirmAssignmentAction } from "@/lib/actions/firms";
import type { AppUser, Firm } from "@/lib/types";

export function FirmAssignmentForm({
  firm,
  users,
}: {
  firm: Firm;
  users: AppUser[];
}) {
  const [state, action] = useActionState(updateFirmAssignmentAction, {});

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="firm_id" value={firm.id} />
      <div className="space-y-2">
        <Label htmlFor="assigned_to">Atanan satışçı</Label>
        <Select id="assigned_to" name="assigned_to" defaultValue={firm.assigned_to ?? ""}>
          <option value="">Atamayı kaldır</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
      </div>
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton>Atamayı Güncelle</SubmitButton>
    </form>
  );
}
