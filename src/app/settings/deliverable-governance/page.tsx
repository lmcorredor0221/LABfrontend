import { redirect } from "next/navigation";

export default function Page() {
  redirect("/settings?section=product-governance&tab=components");
}
