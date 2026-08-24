import type { Metadata } from "next";
import { HotmartActivationPage } from "@/features/hotmart/hotmart-activation-page";

export const metadata: Metadata = {
  title: "Activar compra Hotmart",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <HotmartActivationPage activationToken={token} />;
}
