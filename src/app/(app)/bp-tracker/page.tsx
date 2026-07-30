'use client';

// ============================================================
// RemindMe AI — Blood Pressure Tracker Wrapper
// ============================================================

import React, { useState, useEffect } from 'react';
import BpTrackerComponent from '@/components/bp-tracker/BpTrackerComponent';

export default function BpTrackerPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  return <BpTrackerComponent />;
}
