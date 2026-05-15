import { ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  detail,
  accent = "emerald",
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: "emerald" | "amber" | "sky" | "rose" | "indigo";
}) {
  const accents = {
    emerald: "from-emerald-100 to-emerald-50 text-emerald-900",
    amber: "from-amber-100 to-amber-50 text-amber-900",
    sky: "from-sky-100 to-sky-50 text-sky-900",
    rose: "from-rose-100 to-rose-50 text-rose-900",
    indigo: "from-indigo-100 to-indigo-50 text-indigo-900",
  };

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="p-0">
        <div className={cn("min-w-0 bg-gradient-to-br p-4 sm:p-6", accents[accent])}>
          <div className="mb-4 flex min-w-0 items-center justify-between gap-3 sm:mb-5">
            <p className="min-w-0 text-sm font-medium opacity-80">{label}</p>
            <ArrowUpRight className="size-4 opacity-70" />
          </div>
          <div className="space-y-1">
            <p className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
            {detail ? <p className="text-sm opacity-80">{detail}</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
