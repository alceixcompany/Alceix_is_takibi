import { Badge } from "@/components/ui/badge";
import { FIRM_STATUS_META } from "@/lib/constants";
import type { FirmStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FirmStatusBadge({ status }: { status: FirmStatus }) {
  const meta = FIRM_STATUS_META[status];

  return <Badge className={cn("border", meta.className)}>{meta.label}</Badge>;
}
