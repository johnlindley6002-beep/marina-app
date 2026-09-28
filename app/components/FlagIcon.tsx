import Image from "next/image";
import { COUNTRY_FLAGS } from "../../data/marinas";

export default function FlagIcon({
  countryCode,
  className = "h-3.5 w-auto",
}: {
  countryCode: string;
  className?: string;
}) {
  const src = COUNTRY_FLAGS[countryCode];
  if (!src) return null;

  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={900}
      height={600}
      className={`inline-block rounded-[1px] align-middle ${className}`}
    />
  );
}
