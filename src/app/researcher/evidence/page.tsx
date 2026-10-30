import { redirect } from "next/navigation";

export const instant = false;

export default function ResearcherEvidenceRedirectPage() {
  redirect("/researcher/projects");
}
