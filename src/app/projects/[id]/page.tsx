import { ProjectRootRedirect } from "@/features/sessions/project-root-redirect";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ProjectRootRedirect sessionId={id} />;
}
