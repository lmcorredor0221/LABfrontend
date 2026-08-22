import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPage } from "@/components/lean/auth-pages";

export const metadata: Metadata = {
  title: "Iniciar sesion",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14]" />}>
      <LoginPage />
    </Suspense>
  );
}
