import { Badge } from "@/components/ui/badge";
import { PRODUCTION_STATUS_META } from "@/lib/constants";
import type { ProductionTaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductionStatusBadge({ status }: { status: ProductionTaskStatus }) {
  const meta = PRODUCTION_STATUS_META[status];

  return <Badge className={cn("border", meta.className)}>{meta.label}</Badge>;
}
