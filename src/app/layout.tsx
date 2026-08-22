import type { Metadata } from "next";
import { cookies } from "next/headers";
import { resolveInitialLanguage } from "@/core/i18n/language-config";
import { AppProviders } from "@/core/providers/app-providers";
import { SITE_NAME, SITE_URL } from "@/core/seo/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Design, evaluate, and document AI agents before coding. Lean Agent Builder helps teams validate workflows and integrations with less delivery risk.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
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
