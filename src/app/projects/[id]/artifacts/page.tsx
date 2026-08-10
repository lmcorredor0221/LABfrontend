import { ProjectExperienceBoundary } from "@/features/product-experience/shell/project-experience-boundary";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page(props: PageProps) {
  const { id } = await props.params;

  return <ProjectExperienceBoundary productSection="artifacts" sessionId={id} stage="estimate" />;
}
