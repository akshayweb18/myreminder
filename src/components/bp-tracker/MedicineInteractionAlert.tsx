'use client';

// ============================================================
// RemindMe — Medicine Interaction Alert Component
// Shows AI-powered drug interaction warnings in BP Tracker
// ============================================================

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Interaction {
  severity: 'mild' | 'moderate' | 'severe';
  medicines: string[];
  description: string;
}

interface MedicineInteractionResult {
  safe: boolean;
  interactions: Interaction[];
  foodWarnings: string[];
  summary: string;
}

interface MedicineInteractionAlertProps {
  result: MedicineInteractionResult;
  medicineName: string;
  onDismiss: () => void;
}

const severityConfig = {
  mild: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: Info,
    label: 'Mild',
  },
  moderate: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: AlertTriangle,
    label: 'Moderate',
  },
  severe: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: AlertTriangle,
    label: 'Severe',
  },
};

export function MedicineInteractionAlert({ result, medicineName, onDismiss }: MedicineInteractionAlertProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(
          'rounded-2xl border p-4 space-y-3',
          result.safe ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-amber-500/8 border-amber-500/25',
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'h-8 w-8 rounded-xl flex items-center justify-center shrink-0',
              result.safe ? 'bg-emerald-500/20' : 'bg-amber-500/20',
            )}>
              {result.safe
                ? <ShieldCheck size={16} className="text-emerald-400" />
                : <AlertTriangle size={16} className="text-amber-400" />}
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {result.safe ? '✅ No Interactions Detected' : '⚠️ Drug Interactions Found'}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                {medicineName} — AI Interaction Check
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Summary */}
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{result.summary}</p>

        {/* Interactions */}
        {result.interactions.map((interaction, i) => {
          const config = severityConfig[interaction.severity];
          const Icon = config.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className={cn('p-3 rounded-xl border text-xs space-y-1', config.bg, config.border)}
            >
              <div className="flex items-center gap-1.5">
                <Icon size={12} className={config.text} />
                <span className={cn('font-semibold', config.text)}>{config.label} Interaction</span>
                <span className="text-[var(--text-tertiary)]">— {interaction.medicines.join(' + ')}</span>
              </div>
              <p className="text-[var(--text-secondary)] pl-4">{interaction.description}</p>
            </motion.div>
          );
        })}

        {/* Food Warnings */}
        {result.foodWarnings.length > 0 && (
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/25 space-y-2">
            <p className="text-xs font-semibold text-orange-400 flex items-center gap-1.5">
              🍊 Food & Drink Warnings
            </p>
            <ul className="space-y-1">
              {result.foodWarnings.map((w, i) => (
                <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                  <span className="text-orange-400 shrink-0">•</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-[var(--text-tertiary)] italic">
          ⚕️ Consult your pharmacist or doctor before making any medication changes.
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
