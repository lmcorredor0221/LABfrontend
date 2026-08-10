import { redirect } from "next/navigation";
import { getProjectRoute, resolveProjectStage } from "@/core/routing/routes";

type PageProps = {
  params: Promise<{
    id: string;
    stage: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page(props: PageProps) {
  const { id, stage } = await props.params;
  const searchParams = await props.searchParams;
  const resolution = resolveProjectStage(stage, {
    searchParams,
    sessionId: id,
  });

  if (resolution.redirectPath) {
    redirect(resolution.redirectPath);
  }

  redirect(getProjectRoute(id, resolution.stage, { section: resolution.section }));
}
