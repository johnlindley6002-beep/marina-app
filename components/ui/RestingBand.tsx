import Image from "next/image";

// A pause, not content: a full-bleed image with no text over it. With no image
// supplied it renders nothing, so there is no empty plate on the page.
export default function RestingBand({
  image,
}: {
  image: { src: string; alt: string } | null | undefined;
}) {
  if (!image) return null;
  return (
    <div className="on-ink relative isolate h-[18rem] overflow-hidden bg-ink md:h-[30rem]">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        loading="lazy"
        sizes="100vw"
        className="object-cover"
      />
    </div>
  );
}
