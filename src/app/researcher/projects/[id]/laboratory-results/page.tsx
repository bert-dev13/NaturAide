import { redirect } from "next/navigation";

/** Laboratory Results lives inside Paper Submission — redirect legacy URLs. */
export default async function LaboratoryResultsRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/researcher/projects/${id}/submission?step=2`);
}
