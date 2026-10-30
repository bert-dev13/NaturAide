import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import RegulatoryVerificationDetail from "@/components/regulatory/RegulatoryVerificationDetail";
import { getRegulatoryProduct } from "@/lib/regulatory-verification-service";

export const instant = false;

export default async function ReviewerRegulatoryProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "REVIEWER") redirect("/login");

  const { slug } = await params;
  const product = await getRegulatoryProduct(slug);
  if (!product) notFound();

  return <RegulatoryVerificationDetail product={product} backHref="/reviewer/products" />;
}
