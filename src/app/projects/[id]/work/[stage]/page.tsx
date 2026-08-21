import { redirect } from "next/navigation";
import { resolveProjectStage } from "@/core/routing/routes";
import { ProjectExperienceBoundary } from "@/features/product-experience/shell/project-experience-boundary";

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

  if (resolution.stage === "validate") {
    redirect(`/projects/${id}/acp?acp_tab=validate`);
  }

  if (resolution.stage === "package") {
    redirect(`/projects/${id}/acp?acp_tab=package`);
  }

  return <ProjectExperienceBoundary productSection="work" section={resolution.section} sessionId={id} stage={resolution.stage} />;
}
