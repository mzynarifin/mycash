import { Skeleton } from "@/components/ui/skeleton";

function LoadingLabel() {
  return <span className="sr-only">Memuat konten...</span>;
}

export function ListPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-5" aria-busy="true">
      <LoadingLabel />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64 max-w-[70vw]" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="flex flex-wrap gap-2 border-y border-border py-4">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-border px-4 py-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-0">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-[min(15rem,70%)]" />
              <Skeleton className="h-3 w-[min(20rem,85%)]" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UserDashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8" aria-busy="true">
      <LoadingLabel />
      <div className="space-y-2"><Skeleton className="h-8 w-36" /><Skeleton className="h-4 w-56" /></div>
      <div className="space-y-5 border-y border-border py-8">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-11 w-72 max-w-[80vw]" />
        <div className="grid grid-cols-3 gap-4"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5" aria-busy="true">
      <LoadingLabel />
      <div className="flex items-start justify-between"><div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-80 max-w-[65vw]" /></div><Skeleton className="h-10 w-56" /></div>
      <div className="grid overflow-hidden rounded-lg border border-border sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-none border-b border-border xl:border-b-0" />)}</div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
      <Skeleton className="h-44" />
    </div>
  );
}
