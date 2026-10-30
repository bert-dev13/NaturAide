import { redirect } from "next/navigation";

export const instant = false;

export default function PreparationRedirect() {
  redirect("/community/herbal-guide");
}
