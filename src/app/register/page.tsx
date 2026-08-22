import type { Metadata } from "next";
import { RegisterPage } from "@/components/lean/register-page";

export const metadata: Metadata = {
  title: "Registro",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <RegisterPage />;
}
