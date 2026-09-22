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

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={`inline-block rounded-[1px] align-middle ${className}`}
    />
  );
}
