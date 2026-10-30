import { redirect } from "next/navigation";

export const instant = false;

export default async function HerbalFinderRedirect({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; tab?: string; category?: string; concern?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const queryParts = [];
  if (params.q) queryParts.push(`q=${encodeURIComponent(params.q)}`);
  if (params.tab) queryParts.push(`tab=${encodeURIComponent(params.tab)}`);
  const queryStr = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  redirect(`/community/herbal-guide${queryStr}`);
}
