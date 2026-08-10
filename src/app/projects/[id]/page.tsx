import { redirect } from "next/navigation";
import { getProjectProductRoute } from "@/core/routing/routes";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  redirect(getProjectProductRoute(id, "blueprint"));
}
