import { redirect } from "next/navigation";

export const instant = false;

export default async function ProfessionalReviewRolePage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ projectId?: string; assignmentId?: string }>;
}) {
  const { role } = await params;
  const sp = await searchParams;
  const query = new URLSearchParams();
  if (sp.projectId) query.set("projectId", sp.projectId);
  if (sp.assignmentId) query.set("assignmentId", sp.assignmentId);

  const qs = query.toString();
  redirect(`/reviewer/checking/${role}${qs ? `?${qs}` : ""}`);
}

