import { redirect } from "next/navigation";

export const instant = false;

export default async function LegacyReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/researcher/projects/${id}/expert-review`);
}
