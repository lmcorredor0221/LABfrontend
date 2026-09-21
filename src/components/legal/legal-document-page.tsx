import Link from "next/link";
import type { ReactNode } from "react";

export function LegalDocumentPage({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-700 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <Link className="text-sm font-semibold text-indigo-700 hover:underline" href="/es">
          ← Volver a Lean Agent Builder
        </Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Lean Agent Builder</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Versión 1.0 · vigente desde agosto de 2026</p>
        <div className="mt-8 space-y-6 text-[15px] leading-7">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
