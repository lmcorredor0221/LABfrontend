import { CommerceProviderAdminPage } from "@/features/commerce-providers/commerce-provider-admin-page";

export default async function Page({ params }: { params: Promise<{ providerKey: string }> }) {
  const { providerKey } = await params;
  return <CommerceProviderAdminPage initialProviderKey={providerKey} />;
}
