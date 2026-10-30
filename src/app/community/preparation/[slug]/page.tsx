import { redirect } from "next/navigation";

export const instant = false;

export default async function PreparationSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/community/plants/${slug}/preparation`);
}
