'use client';

// ============================================================
// RemindMe AI — Switch Component
// ============================================================

import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

interface SwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  label?: string;
  description?: string;
}

export function Switch({ className, label, description, id, ...props }: SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label htmlFor={id} className="text-sm font-medium text-[var(--text-primary)] cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-[var(--text-tertiary)]">{description}</p>
          )}
        </div>
      )}
      <SwitchPrimitive.Root
        id={id}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer',
          'items-center rounded-full',
          'border-2 border-transparent',
          'bg-[var(--surface-3)]',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
          'data-[state=checked]:bg-[var(--accent)]',
          'disabled:opacity-50',
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg',
            'ring-0 transition-transform duration-200',
            'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5',
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}
