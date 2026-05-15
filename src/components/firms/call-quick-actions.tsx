"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { quickUpdateFirmStatusAction } from "@/lib/actions/firms";
import { FIRM_STATUS_META } from "@/lib/constants";
import type { FirmStatus } from "@/lib/types";

const quickStatuses: FirmStatus[] = [
  "arandi",
  "ulasilamadi",
  "ilgilenmedi",
  "ilgilendi",
  "whatsapp_atildi",
  "teklif_verildi",
  "odeme_bekleniyor",
  "odeme_alindi",
];

export function CallQuickActions({ firmId }: { firmId: string }) {
  const [state, action] = useActionState(quickUpdateFirmStatusAction, {});

  return (
    <form action={action} className="max-w-full space-y-2">
      <input type="hidden" name="firm_id" value={firmId} />
      <div className="table-scroll max-w-full overflow-x-auto rounded-xl pb-1">
        <div className="flex w-max min-w-max gap-2">
          {quickStatuses.map((status) => (
            <SubmitButton
              key={status}
              name="status"
              value={status}
              size="sm"
              variant={status === "odeme_alindi" ? "default" : "outline"}
              className="h-auto min-h-10 w-28 shrink-0 whitespace-normal px-2 py-2 text-center text-[12px] leading-tight"
            >
              {FIRM_STATUS_META[status].label}
            </SubmitButton>
          ))}
        </div>
      </div>
      <FormMessage error={state.error} success={state.success} />
    </form>
  );
}
