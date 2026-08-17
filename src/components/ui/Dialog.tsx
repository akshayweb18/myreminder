'use client';

// ============================================================
// RemindMe — Dialog (Modal) Component
// ============================================================

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50',
        'bg-black/60 backdrop-blur-sm',
        'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  title,
  description,
  showClose = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  title?: string;
  description?: string;
  showClose?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50',
          '-translate-x-1/2 -translate-y-1/2',
          'w-full max-w-lg',
          'bg-[var(--surface-1)] border border-[var(--border)]',
          'rounded-2xl shadow-[var(--shadow-xl)]',
          'p-6',
          'data-[state=open]:animate-scale-in',
          className,
        )}
        {...props}
      >
        {(title || description) && (
          <DialogPrimitive.Title className="text-xl font-bold text-[var(--text-primary)] mb-1 font-display">
            {title}
          </DialogPrimitive.Title>
        )}
        {description && (
          <DialogPrimitive.Description className="text-sm text-[var(--text-secondary)] mb-4">
            {description}
          </DialogPrimitive.Description>
        )}
        {children}
        {showClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
            <X size={16} />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogClose };
