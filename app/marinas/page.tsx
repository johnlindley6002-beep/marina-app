import type { Metadata } from "next";
import { getCountries } from "../../data/marinas";
import MarinasListContent from "./MarinasListContent";

export const metadata: Metadata = {
  title: "Marinas — aldock",
  description: "Browse marinas by country.",
};

export default function MarinasPage() {
  const countries = getCountries();
  return <MarinasListContent countries={countries} />;
}
