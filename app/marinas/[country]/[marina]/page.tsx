import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMarina, marinas } from "../../../../data/marinas";
import CascaisPageContent from "./CascaisPageContent";

type Props = {
  params: Promise<{ country: string; marina: string }>;
  searchParams: Promise<{
    arrival?: string;
    departure?: string;
    length?: string;
  }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { country, marina: marinaId } = await params;
  const marina = getMarina(country, marinaId);
  if (!marina) return {};
  return {
    title: `${marina.name} - aldock`,
    description: marina.description,
    openGraph: {
      title: `${marina.name} - aldock`,
      description: marina.description,
      images: [marina.heroImage?.src ?? marina.wordmark],
    },
  };
}

export default async function MarinaPage({ params, searchParams }: Props) {
  const { country, marina: marinaId } = await params;
  const { arrival, departure, length } = await searchParams;
  const marina = getMarina(country, marinaId);

  if (!marina) {
    notFound();
  }

  return (
    <CascaisPageContent
      marina={marina}
      initialArrival={arrival}
      initialDeparture={departure}
      initialLength={length}
    />
  );
}

export async function generateStaticParams() {
  return marinas.map((marina) => ({
    country: marina.countrySlug,
    marina: marina.id,
  }));
}
