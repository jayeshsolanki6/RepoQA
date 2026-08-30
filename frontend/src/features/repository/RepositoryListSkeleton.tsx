import { Card } from '@/components/ui/Card';

/** Placeholder that mirrors RepositoryCard's shape while the list loads. */
function RepositoryCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className="skeleton h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <span className="skeleton block h-3.5 w-40 rounded" />
          <span className="skeleton mt-2 block h-2.5 w-56 max-w-full rounded" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <span className="skeleton h-2.5 w-24 rounded" />
        <div className="flex items-center gap-2">
          <span className="skeleton h-8 w-8 rounded-lg" />
          <span className="skeleton h-8 w-20 rounded-xl" />
        </div>
      </div>
    </Card>
  );
}

export function RepositoryListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <RepositoryCardSkeleton key={index} />
      ))}
    </div>
  );
}
