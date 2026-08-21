"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { TopUtilities, WorkspaceShell } from "@/components/lean/shell";
import { AdminRequestsPage } from "@/features/operations/admin-requests-page";
import { useLanguage } from "@/core/i18n/language-context";

export default function Page() {
  const { t } = useLanguage();

  return (
    <WorkspaceShell>
      <header className="border-b border-[var(--border-default)] bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              aria-label={t("shell.homeAria", "Lean Agent Builder - Inicio")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--gradient-primary)] text-white shadow-sm"
              href="/"
            >
              <Sparkles aria-hidden="true" className="h-5 w-5" />
            </Link>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Admin del Sistema
              </span>
              <h2 className="text-[16px] font-bold text-[var(--text-primary)]">
                Gestión de Solicitudes
              </h2>
            </div>
          </div>
          <TopUtilities />
        </div>
      </header>
      <main>
        <AdminRequestsPage />
      </main>
    </WorkspaceShell>
  );
}
