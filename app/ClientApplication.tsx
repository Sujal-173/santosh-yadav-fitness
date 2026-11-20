'use client';

import nextDynamic from 'next/dynamic';

// The legacy app uses window/sessionStorage for route state. Keep it client-only.
const ExistingApp = nextDynamic(() => import('../src/App'), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen bg-[#0B0D0E]" aria-label="Loading Santosh Yadav Fitness">
      <div className="mx-auto max-w-6xl px-6 py-24 text-sm text-white/70">Loading…</div>
    </main>
  ),
});

export default function ClientApplication() {
  return <ExistingApp />;
}
