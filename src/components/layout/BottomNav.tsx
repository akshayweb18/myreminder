'use client';

// ============================================================
// RemindMe AI — Bottom Navigation (Mobile)
// ============================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Bell, Calendar, Heart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/bp-tracker', label: 'BP Tracker', icon: Heart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Blur backdrop */}
      <div className="glass-strong border-t border-[var(--border)]">
        <div className="flex items-center justify-around px-2 py-2 pb-safe-bottom">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');

            return (
              <Link key={href} href={href} className="flex-1">
                <div className="flex flex-col items-center gap-0.5 py-1">
                  <div className="relative">
                    {active && (
                      <motion.div
                        layoutId="bottom-nav-indicator"
                        className="absolute -inset-2 rounded-xl bg-[var(--accent)]/15"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon
                      size={22}
                      className={cn(
                        'relative z-10 transition-colors',
                        active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]',
                      )}
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium transition-colors',
                      active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]',
                    )}
                  >
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
