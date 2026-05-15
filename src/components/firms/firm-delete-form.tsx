"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { deleteFirmAction } from "@/lib/actions/firms";

export function FirmDeleteForm({ firmId, compact = false }: { firmId: string; compact?: boolean }) {
  const [state, action] = useActionState(deleteFirmAction, {});

  return (
    <form action={action} className={compact ? "space-y-1" : "space-y-3"}>
      <input type="hidden" name="firm_id" value={firmId} />
      <Button
        type="submit"
        variant="outline"
        className="border-red-200 text-red-700 hover:bg-red-50"
        onClick={(event) => {
          if (!window.confirm("Bu firmayı silmek istediğine emin misin?")) {
            event.preventDefault();
          }
        }}
      >
        Sil
      </Button>
      {!compact ? <FormMessage error={state.error} success={state.success} /> : null}
    </form>
  );
}
