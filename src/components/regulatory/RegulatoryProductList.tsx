import Link from "next/link";
import RecordImage from "@/components/community/RecordImage";
import { isVerifiedProductImage, getProductImageKind } from "@/lib/record-images";
import ProductImageBadge from "@/components/community/ProductImageBadge";
import { communityVerificationMessage, getRegulatoryAudit } from "@/lib/regulatory-verification";
import type { RegulatoryProductSummary } from "@/lib/regulatory-verification-service";

export default function RegulatoryProductList({
  products,
  basePath,
}: {
  products: RegulatoryProductSummary[];
  basePath: string;
}) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-[#dde6df] bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#faf9f5] text-[11px] uppercase tracking-wide text-[#78997f]">
          <tr>
            <th className="px-4 py-3 font-bold">Product</th>
            <th className="px-4 py-3 font-bold">Package Image</th>
            <th className="px-4 py-3 font-bold">Registration</th>
            <th className="px-4 py-3 font-bold">NatureAide check</th>
            <th className="px-4 py-3 font-bold">Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const message = communityVerificationMessage(
              getRegulatoryAudit({
                verification_status: product.verificationStatus,
                verified_at: product.verifiedAt,
                verified_by: product.verifiedBy,
              })
            );
            const imageKind = (product as any).imageType || getProductImageKind(product.imagePath || product.imageUrl, product.imageVerified);
            return (
              <tr key={product.id} className="border-t border-[#dde6df]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[#dde6df] bg-[#faf9f5]">
                      <RecordImage
                        kind="product"
                        src={product.imagePath || product.imageUrl}
                        isVerified={imageKind === "AUTHENTIC_PRODUCT"}
                        imageType={imageKind}
                        alt={product.name}
                        sizes="44px"
                      />
                    </div>
                    <div>
                      <p className="font-extrabold text-[#0f2c20]">{product.name}</p>
                      <p className="text-xs text-[#52796f]">{product.manufacturer}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <ProductImageBadge imageType={imageKind} />
                </td>
                <td className="px-4 py-3 text-xs text-[#0f2c20]">
                  <p className="font-mono">{product.registrationNumber || "Not recorded"}</p>
                  <p>{product.regulatoryAgency || "No agency recorded"}</p>
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-[#0f2c20]">{message.title}</td>
                <td className="px-4 py-3">
                  <Link href={`${basePath}/${product.slug}`} className="text-xs font-bold text-emerald-800 hover:underline">
                    Regulatory Verification
                  </Link>
                </td>
              </tr>
            );
          })}
          {products.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#52796f]">
                No herbal products are recorded.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
