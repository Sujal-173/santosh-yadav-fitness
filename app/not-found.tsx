import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0B0D0E] text-white flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F47716]">404 · Page not found</p>
        <h1 className="mt-3 text-3xl font-bold">Yeh page available nahi hai.</h1>
        <p className="mt-3 text-sm text-white/65">The link may be incorrect or the page may have moved.</p>
        <Link href="/" className="mt-7 inline-flex rounded-lg bg-[#F47716] px-5 py-3 text-sm font-semibold text-white hover:bg-[#FF9A32]">Back to home</Link>
      </div>
    </main>
  );
}
