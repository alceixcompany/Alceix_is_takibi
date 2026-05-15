import { cn } from "@/lib/utils";

export function FormMessage({
  error,
  success,
  className,
}: {
  error?: string;
  success?: string;
  className?: string;
}) {
  if (!error && !success) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-2 text-sm",
        error
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800",
        className,
      )}
    >
      {error ?? success}
    </div>
  );
}
