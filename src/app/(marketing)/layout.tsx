import Link from 'next/link';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col">
      {/* Marketing Navbar */}
      <header className="sticky top-0 z-50 glass-strong border-b border-[var(--border)] h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center text-white shadow-lg font-bold">
              🔔
            </div>
            <span className="text-lg font-bold font-display tracking-tight">RemindMe</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-[var(--accent)] to-purple-500 text-white shadow-lg shadow-[var(--accent-glow)] hover:opacity-90 transition-opacity"
            >
              Open App
            </Link>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 bg-[var(--surface-1)]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-tertiary)]">
          <p>© {new Date().getFullYear()} RemindMe. Remember Everything. Forget Nothing.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
