'use client';

// ============================================================
// RemindMe AI — Skeleton Component
// ============================================================

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: boolean;
}

export function Skeleton({ className, rounded, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer',
        rounded ? 'rounded-full' : 'rounded-xl',
        className,
      )}
      {...props}
    />
  );
}

export function ReminderCardSkeleton() {
  return (
    <div className="card p-4 flex items-start gap-3">
      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}
