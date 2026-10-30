import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

interface Props {
  params: Promise<{ id: string }>;
}

export const instant = false;

export default async function LaboratoryPage({ params }: Props) {
  const session = await getSession();
  if (!session || session.role !== "RESEARCHER") {
    redirect("/login");
  }

  const { id } = await params;
  const projectId = parseInt(id, 10);
  if (isNaN(projectId)) {
    redirect("/researcher/projects");
  }

  // Gracefully redirect obsolete Stage 5 Laboratory route to Stage 5 Research Integration
  redirect(`/researcher/projects/${projectId}/completion-integration`);
}
