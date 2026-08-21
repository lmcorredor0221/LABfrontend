import { redirect } from "next/navigation";

export default function Page() {
  redirect("/settings?section=configuration&config=commerce&subtab=hotmart");
}
