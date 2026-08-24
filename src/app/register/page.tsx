import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterPage } from "@/components/lean/register-page";

export const metadata: Metadata = {
  title: "Registro",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14]" />}>
      <RegisterPage />
    </Suspense>
  );
}
