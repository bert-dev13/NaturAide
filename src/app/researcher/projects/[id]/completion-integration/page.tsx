import { redirect } from "next/navigation";

export const instant = false;

/**
 * Legacy completion-integration alias.
 * Previously redirected to Safety / Clinical (removed) — now Knowledge Integration.
 */
export default async function LegacyCompletionIntegrationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/researcher/projects/${id}/knowledge-integration`);
}
