import { cn } from "@/lib/utils";

export function ProgressMeter({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const width = `${Math.max(0, Math.min(100, Math.round(value * 100)))}%`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{width}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={cn("h-2 rounded-full bg-primary transition-all")}
          style={{ width }}
        />
      </div>
    </div>
  );
}
