'use client';

// ============================================================
// RemindMe — PriorityBadge Component
// ============================================================

import { Priority } from '@/types';
import { getPriorityConfig } from '@/constants';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
  className?: string;
}

export function PriorityBadge({ priority, size = 'sm', className }: PriorityBadgeProps) {
  const config = getPriorityConfig(priority);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
      style={{
        background: config.bgColor,
        color: config.color,
        border: `1px solid ${config.color}30`,
      }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: config.color }} />
      {config.label}
    </span>
  );
}
