import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCountries, getMarinasByCountry } from "../../../data/marinas";
import CountryPageContent from "./CountryPageContent";

type Props = {
  params: Promise<{ country: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { country } = await params;
  const marinas = getMarinasByCountry(country);
  const countryName = marinas[0]?.country ?? country;
  return {
    title: `Marinas in ${countryName} — aldock`,
  };
}

export default async function CountryPage({ params }: Props) {
  const { country } = await params;
  const marinas = getMarinasByCountry(country);

  if (marinas.length === 0) {
    notFound();
  }

  return (
    <CountryPageContent marinas={marinas} countryName={marinas[0].country} />
  );
}

export async function generateStaticParams() {
  return getCountries().map((country) => ({ country: country.slug }));
}
