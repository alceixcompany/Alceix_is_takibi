import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, ROLE_STYLES } from "@/lib/constants";
import type { AppRole } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RoleBadges({ roles }: { roles: AppRole[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <Badge key={role} className={cn("border", ROLE_STYLES[role])}>
          {ROLE_LABELS[role]}
        </Badge>
      ))}
    </div>
  );
}
