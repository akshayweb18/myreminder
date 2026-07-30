import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute h-96 w-96 rounded-full bg-[var(--accent)]/15 blur-3xl pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="mb-6 flex items-center gap-2">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center text-white text-xl shadow-lg">
          🔔
        </div>
        <span className="text-xl font-bold font-display text-[var(--text-primary)]">RemindMe AI</span>
      </Link>

      <div className="w-full max-w-md card p-8 relative z-10 shadow-[var(--shadow-xl)]">
        {children}
      </div>
    </div>
  );
}
