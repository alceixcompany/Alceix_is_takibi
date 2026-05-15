import { Badge } from "@/components/ui/badge";
import { TASK_PRIORITY_META } from "@/lib/constants";
import type { ProductionTaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TaskPriorityBadge({ priority }: { priority: ProductionTaskPriority }) {
  const meta = TASK_PRIORITY_META[priority];

  return <Badge className={cn("border", meta.className)}>{meta.label}</Badge>;
}
