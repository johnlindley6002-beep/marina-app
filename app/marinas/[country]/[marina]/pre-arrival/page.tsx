import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getMarina, marinas } from "../../../../../data/marinas";
import PreArrivalWizard from "./PreArrivalWizard";

type Props = {
  params: Promise<{ country: string; marina: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, marina: marinaId } = await params;
  const marina = getMarina(country, marinaId);
  if (!marina) return {};
  return {
    title: `Pre-arrival check-in - ${marina.name} - aldock`,
    description: `Complete your pre-arrival check-in for ${marina.name} before you arrive.`,
  };
}

export default async function PreArrivalPage({ params }: Props) {
  const { country, marina: marinaId } = await params;
  const marina = getMarina(country, marinaId);

  if (!marina) {
    notFound();
  }

  return (
    <Suspense>
      <PreArrivalWizard marina={marina} />
    </Suspense>
  );
}

export async function generateStaticParams() {
  return marinas.map((marina) => ({
    country: marina.countrySlug,
    marina: marina.id,
  }));
}
