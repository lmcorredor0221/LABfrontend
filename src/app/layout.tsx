import type { Metadata } from "next";
import { cookies } from "next/headers";
import { resolveInitialLanguage } from "@/core/i18n/language-config";
import { AppProviders } from "@/core/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lean Agent Builder",
  description: "Blueprint implementation for the Lean Agent Builder workspace.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLanguage = resolveInitialLanguage(
    cookieStore.get("antigravity_language")?.value,
    "es",
  );

  return (
    <html lang={initialLanguage} className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-[var(--surface-canvas)] text-[var(--text-primary)]" data-visual-theme="enterprise-corporate">
        <div className="app-density app-density-compact" data-density="compact" data-visual-theme="enterprise-corporate">
          <AppProviders initialLanguage={initialLanguage}>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
