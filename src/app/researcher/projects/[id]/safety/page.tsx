import { redirect } from "next/navigation";

/**
 * Legacy Stage 05 Safety / Clinical route.
 * Feature removed — redirect bookmarks to Knowledge Integration.
 */
export default async function LegacySafetyClinicalRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/researcher/projects/${id}/knowledge-integration`);
}
