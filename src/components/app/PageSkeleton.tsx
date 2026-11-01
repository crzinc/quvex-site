/** Placeholder shown the instant a link is tapped, while the next page loads on the server. */
export function PageSkeleton() {
  const bar = "animate-pulse rounded-lg bg-surface-2";
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className={`${bar} h-8 w-48`} />
        <div className={`${bar} h-10 w-32`} />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${bar} h-20`} />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0 sm:px-5">
            <div className={`${bar} size-9 shrink-0 rounded-full`} />
            <div className="flex-1 space-y-2">
              <div className={`${bar} h-3.5 w-2/5`} />
              <div className={`${bar} h-3 w-1/4`} />
            </div>
            <div className={`${bar} h-4 w-16`} />
          </div>
        ))}
      </div>
    </div>
  );
}
