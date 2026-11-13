import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

/** Laboratory Results is Step 2 of Paper Submission on the reviewer page. */
export default async function ReviewerLaboratoryResultsRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "REVIEWER") {
    redirect("/login");
  }

  const { id } = await params;
  redirect(`/reviewer/projects/${id}?tab=section3&step=2`);
}
