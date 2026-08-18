'use client';

// ============================================================
// RemindMe — Bottom Navigation (Mobile PWA)
// Native app-style: center FAB, pill active indicator,
// spring animations, safe-area-inset-bottom support.
// ============================================================

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Bell, Heart, Bot, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEFT_ITEMS = [
  { href: '/dashboard',  label: 'Home',      icon: LayoutDashboard },
  { href: '/reminders',  label: 'Reminders', icon: Bell },
];
const RIGHT_ITEMS = [
  { href: '/bp-tracker', label: 'BP',        icon: Heart },
  { href: '/ai-chat',   label: 'AI Chat',    icon: Bot },
];

export function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Glass backdrop */}
      <div className="glass-strong border-t border-[var(--border)]">
        <div className="flex items-center justify-around px-2 pt-2 pb-1">

          {/* Left two items */}
          {LEFT_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex-1 select-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="flex flex-col items-center gap-0.5 py-0.5 min-h-[48px] justify-center">
                <div className="relative flex items-center justify-center w-10 h-8">
                  {isActive(href) && (
                    <motion.div
                      layoutId="bottom-pill"
                      className="absolute inset-0 rounded-xl bg-[var(--accent)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon
                    size={20}
                    className={cn(
                      'relative z-10 transition-colors duration-200',
                      isActive(href) ? 'text-white' : 'text-[var(--text-tertiary)]',
                    )}
                    strokeWidth={isActive(href) ? 2.5 : 2}
                  />
                </div>
                <span
                  className={cn(
                    'text-[9px] font-semibold tracking-wide transition-colors duration-200',
                    isActive(href) ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]',
                  )}
                >
                  {label}
                </span>
              </div>
            </Link>
          ))}

          {/* Centre FAB — New Reminder */}
          <div className="flex-1 flex justify-center items-center -mt-6">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => router.push('/reminders/new')}
              className={cn(
                'h-14 w-14 rounded-2xl',
                'bg-gradient-to-br from-[var(--accent)] to-purple-500',
                'flex items-center justify-center',
                'shadow-lg shadow-[var(--accent-glow)]',
                'border-4 border-[var(--bg-base)]',
              )}
              aria-label="New Reminder"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Plus size={26} className="text-white" strokeWidth={2.5} />
            </motion.button>
          </div>

          {/* Right two items */}
          {RIGHT_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex-1 select-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="flex flex-col items-center gap-0.5 py-0.5 min-h-[48px] justify-center">
                <div className="relative flex items-center justify-center w-10 h-8">
                  {isActive(href) && (
                    <motion.div
                      layoutId="bottom-pill"
                      className="absolute inset-0 rounded-xl bg-[var(--accent)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon
                    size={20}
                    className={cn(
                      'relative z-10 transition-colors duration-200',
                      isActive(href) ? 'text-white' : 'text-[var(--text-tertiary)]',
                    )}
                    strokeWidth={isActive(href) ? 2.5 : 2}
                  />
                </div>
                <span
                  className={cn(
                    'text-[9px] font-semibold tracking-wide transition-colors duration-200',
                    isActive(href) ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]',
                  )}
                >
                  {label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
