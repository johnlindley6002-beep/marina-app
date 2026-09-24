import Image from "next/image";
import ChartLinework from "./ChartLinework";

// A pause, not content: a full-bleed image with no text over it. With no image
// supplied it is a navy plate with the chart lines, at the same fixed height,
// so dropping a photo in later moves nothing.
export default function RestingBand({
  image,
}: {
  image: { src: string; alt: string } | null | undefined;
}) {
  return (
    <div className="on-ink relative isolate h-[18rem] overflow-hidden bg-gradient-to-br from-ink to-ink-2 md:h-[30rem]">
      {image ? (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          loading="lazy"
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <ChartLinework className="absolute inset-0 -z-10 h-full w-full text-paper opacity-[0.09]" />
      )}
    </div>
  );
}
