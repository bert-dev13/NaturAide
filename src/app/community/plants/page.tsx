import { redirect } from "next/navigation";

export const instant = false;

export default function PlantsPageRedirect() {
  redirect("/community/herbal-guide?tab=plants");
}
