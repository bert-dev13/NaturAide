import { redirect } from "next/navigation";

export const instant = false;

export default function ProductsPageRedirect() {
  redirect("/community/herbal-guide?tab=products");
}
