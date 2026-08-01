import Link from 'next/link';
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl md:grid-cols-2">
        <section className="hidden bg-gradient-to-br from-blue-700 to-indigo-950 p-12 md:block">
          <Link href="/" className="text-lg font-semibold">
            Joel Talargie Academy
          </Link>
          <h1 className="mt-24 text-4xl font-bold leading-tight">
            Learn with purpose.
            <br />
            Build with confidence.
          </h1>
          <p className="mt-5 text-blue-100">Secure access to your learning experience.</p>
        </section>
        <section className="p-7 sm:p-12">{children}</section>
      </div>
    </main>
  );
}
