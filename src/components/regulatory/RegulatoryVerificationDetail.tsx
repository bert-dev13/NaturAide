import Link from "next/link";
import RecordImage from "@/components/community/RecordImage";
import { isVerifiedProductImage, getProductImageKind } from "@/lib/record-images";
import ProductImageBadge, { ProductImageDisclosureNotice } from "@/components/community/ProductImageBadge";
import RegulatoryVerificationForm from "@/components/regulatory/RegulatoryVerificationForm";
import { communityVerificationMessage, getRegulatoryAudit, REGULATORY_VERIFICATION_DISCLAIMER } from "@/lib/regulatory-verification";
import type { RegulatoryProductDetail } from "@/lib/regulatory-verification-service";

export default function RegulatoryVerificationDetail({
  product,
  backHref,
}: {
  product: RegulatoryProductDetail;
  backHref: string;
}) {
  const message = communityVerificationMessage(
    getRegulatoryAudit({
      verification_status: product.verificationStatus,
      verified_at: product.verifiedAt,
      verified_by: product.verifiedBy,
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={backHref} className="text-xs font-bold text-emerald-800 hover:underline">
            All products
          </Link>
          <h1 className="mt-1 text-2xl font-heading font-extrabold text-[#0f2c20]">Regulatory Verification</h1>
          <p className="text-sm text-[#52796f]">{message.title}</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-[#52796f]">{REGULATORY_VERIFICATION_DISCLAIMER}</p>

      {/* Product Image Verification Status Card */}
      {(() => {
        const imageKind = (product as any).imageType || getProductImageKind(product.imagePath || product.imageUrl, product.imageVerified);
        return (
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 rounded-2xl border border-[#dde6df] bg-white">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[#dde6df] bg-[#faf9f5] flex items-center justify-center">
              <RecordImage
                kind="product"
                src={product.imagePath || product.imageUrl}
                isVerified={imageKind === "AUTHENTIC_PRODUCT"}
                imageType={imageKind}
                alt={product.name}
                sizes="96px"
              />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-extrabold text-[#0f2c20]">{product.name}</span>
                <ProductImageBadge imageType={imageKind} />
              </div>
          <p className="text-xs text-[#52796f]">{product.manufacturer}</p>
          {product.imageVerified ? (
            <p className="text-xs text-[#0f2c20]">
              <span className="text-[#52796f]">Source:</span>{" "}
              {product.imageSourceUrl ? (
                <a
                  href={product.imageSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-800 underline hover:text-emerald-950"
                >
                  {product.imageSource || "Official Website"}
                </a>
              ) : (
                <span>{product.imageSource || "Official Source"}</span>
              )}
              {product.imageVerifiedAt && (
                <span className="text-xs text-[#78997f] ml-2">
                  (Verified {new Date(product.imageVerifiedAt).toLocaleDateString()})
                </span>
              )}
            </p>
          ) : (
            <p className="text-xs text-[#78997f]">
              NatureAide verified reference: only authentic commercial package images matching the exact product, brand, and variant are permitted. Generic plants or mismatched variants are not used.
            </p>
          )}
        </div>
      </div>
    );
  })()}

      <RegulatoryVerificationForm product={product} />

      <section className="space-y-3">
        <h2 className="text-lg font-heading font-extrabold text-[#0f2c20]">Verification history</h2>
        {product.history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#dde6df] bg-white p-4 text-sm text-[#52796f]">
            No verification decisions have been recorded for this product.
          </p>
        ) : (
          <ol className="space-y-3">
            {product.history.map((item) => (
              <li key={item.id} className="rounded-2xl border border-[#dde6df] bg-white p-4 text-sm">
                <p className="font-extrabold text-[#0f2c20]">{item.status}</p>
                <p className="text-xs text-[#52796f]">
                  {new Date(item.verifiedAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })} by {item.verifiedByName}
                </p>
                <p className="mt-1 text-xs text-[#0f2c20]">Method: {item.method}</p>
                <p className="text-xs text-[#52796f]">Previous status: {item.previousStatus || "None"}</p>
                {item.notes && <p className="mt-2 text-xs text-[#0f2c20]">{item.notes}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
