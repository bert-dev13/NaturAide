import { redirect } from "next/navigation";

export const instant = false;

export default async function LegacyCompletionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/researcher/projects/${id}/completion-integration`);
}
