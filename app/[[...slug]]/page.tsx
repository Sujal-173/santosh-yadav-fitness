'use client';

import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

// The existing application uses window/sessionStorage for its client-side route state.
// Rendering it client-only avoids changing its UI or behaviour during the migration.
const ExistingApp = nextDynamic(() => import('../../src/App'), {
  ssr: false,
  loading: () => <main className="min-h-screen bg-[#0B0D0E]" aria-label="Loading Santosh Yadav Fitness" />,
});

export default function Page() {
  return <ExistingApp />;
}
