"use client";

import { useRequestBerthForm, type RequestBerthProps } from "./useRequestBerthForm";
import VisitSection from "./VisitSection";
import BoatSection from "./BoatSection";
import SkipperSection from "./SkipperSection";
import ServicesSection from "./ServicesSection";
import VesselStatusSection from "./VesselStatusSection";
import DocumentsSection from "./DocumentsSection";
import SubmitSection from "./SubmitSection";
import SummaryPanel from "./SummaryPanel";

export default function RequestBerthForm(props: RequestBerthProps) {
  const ctx = useRequestBerthForm(props);
  const { marina, formElRef, handleSubmit } = ctx;
  return (
    <div id="request-berth" className="surface-lift scroll-mt-24 p-6 sm:p-8 md:p-10">
      <h2 className="type-heading type-h3 text-ink">Request a berth</h2>
      <p className="mt-2 text-sm text-ink/70">
        Opens a pre-filled email to {marina.name}. Nothing is submitted to a server.
      </p>

      <form ref={formElRef} onSubmit={handleSubmit} noValidate className="mt-8 space-y-12">
        <VisitSection ctx={ctx} />
        <BoatSection ctx={ctx} />
        <SkipperSection ctx={ctx} />
        <ServicesSection ctx={ctx} />
        <VesselStatusSection ctx={ctx} />
        <DocumentsSection ctx={ctx} />
        <SubmitSection ctx={ctx} />
      </form>

      <SummaryPanel ctx={ctx} />
    </div>
  );
}
