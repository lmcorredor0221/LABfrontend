import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page(props: PageProps) {
  const { id } = await props.params;

  redirect(`/projects/${id}/acp`);
}

