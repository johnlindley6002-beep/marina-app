import type { Metadata } from "next";
import MarinasResults from "./MarinasResults";

export const metadata: Metadata = {
  title: "Marinas - aldock",
  description: "Find a marina by name, region or country.",
};

type Props = {
  searchParams: Promise<{
    q?: string;
    arrival?: string;
    departure?: string;
    length?: string;
  }>;
};

export default async function MarinasPage({ searchParams }: Props) {
  const { q = "", arrival = "", departure = "", length = "" } =
    await searchParams;
  return (
    <MarinasResults
      q={q}
      arrival={arrival}
      departure={departure}
      length={length}
    />
  );
}
