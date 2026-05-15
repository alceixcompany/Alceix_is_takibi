export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
        <div className="mt-4 h-8 w-64 max-w-full animate-pulse rounded-full bg-muted" />
        <div className="mt-3 h-4 w-full max-w-lg animate-pulse rounded-full bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-3xl border border-border bg-white shadow-sm" />
        ))}
      </div>
    </div>
  );
}
