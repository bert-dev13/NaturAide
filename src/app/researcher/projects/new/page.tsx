import { redirect } from "next/navigation";

export default function NewResearchProjectRedirectPage() {
  redirect("/researcher/projects?new=true");
}
