import { Badge } from "@/components/ui/badge";
import { getFirmStatusMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function FirmStatusBadge({ status }: { status: string }) {
  const meta = getFirmStatusMeta(status);

  return <Badge className={cn("border", meta.className)}>{meta.label}</Badge>;
}
