'use client';

// ============================================================
// RemindMe AI — StatsCard Component
// ============================================================

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: { value: number; label: string };
  className?: string;
  delay?: number;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = '#6366f1',
  iconBgColor = '#6366f120',
  trend,
  className,
  delay = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 30 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        'relative overflow-hidden',
        'bg-[var(--surface-1)] border border-[var(--border)]',
        'rounded-2xl p-5',
        'shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]',
        'transition-shadow duration-200',
        className,
      )}
    >
      {/* Background gradient blob */}
      <div
        className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-xl"
        style={{ background: iconColor }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
            {title}
          </p>
          <motion.p
            className="text-3xl font-bold font-display text-[var(--text-primary)]"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.1, type: 'spring', stiffness: 400 }}
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-semibold',
                  trend.value >= 0 ? 'text-emerald-400' : 'text-red-400',
                )}
              >
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">{trend.label}</span>
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-center h-12 w-12 rounded-2xl shrink-0"
          style={{ background: iconBgColor }}
        >
          <Icon size={22} style={{ color: iconColor }} strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  );
}
