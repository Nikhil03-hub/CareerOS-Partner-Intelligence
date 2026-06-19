export function PageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="p-6 space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-lg bg-muted" />
          <div className="h-4 w-56 rounded bg-muted/60" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-muted" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="h-10 bg-muted/40 border-b" />
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-3.5 border-b last:border-0">
            <div className="h-4 w-32 rounded bg-muted flex-shrink-0" />
            <div className="h-4 w-24 rounded bg-muted/60" />
            <div className="h-4 w-16 rounded bg-muted/40 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
