import Image from "next/image";
import { isRecordPlaceholder, resolvePlantImage, resolveProductImage } from "@/lib/record-images";

type RecordImageProps = {
  kind: "plant" | "product";
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  isVerified?: boolean | number | null;
  imageType?: string | null;
};

export default function RecordImage({
  kind,
  src,
  alt,
  sizes,
  className,
  priority = false,
  isVerified,
  imageType,
}: RecordImageProps) {
  const resolved = kind === "plant" ? resolvePlantImage(src) : resolveProductImage(src, isVerified, imageType);

  if (isRecordPlaceholder(resolved)) {
    return (
      // The placeholder is an original SVG, which the image optimizer does not accept.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={resolved} alt={alt} className="absolute inset-0 h-full w-full object-contain p-2" />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className || (kind === "product" ? "object-contain p-1" : "object-cover")}
    />
  );
}
