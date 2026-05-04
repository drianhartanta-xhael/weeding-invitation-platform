import { type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  /** Hex color for the 3px vertical accent bar on the left edge. */
  accentColor: string;
  label: string;
  value: ReactNode;
  sub?: string;
  loading?: boolean;
}

export function StatCard({ accentColor, label, value, sub, loading = false }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-border bg-card px-[18px] py-4">
      <span
        className="absolute left-0 top-0 h-full w-[3px] rounded-r-sm"
        style={{ backgroundColor: accentColor }}
        aria-hidden
      />
      <div className="pl-1.5">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
          {label}
        </div>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <div className="text-[26px] font-bold leading-none tracking-tight text-foreground">{value}</div>
        )}
        {sub && <div className="mt-1.5 text-[11px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
