import { Suspense } from "react";
import { LoginPage } from "@/components/lean/auth-pages";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14]" />}>
      <LoginPage />
    </Suspense>
  );
}
