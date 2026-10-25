"use client";
import type { RequestBerthCtx } from "./useRequestBerthForm";

export default function ServicesSection({ ctx }: { ctx: RequestBerthCtx }) {
  const { form, setField } = ctx;
  return (
    <>
      <fieldset>
        <legend className="type-heading text-xl text-ink">Services &amp; assistance</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.helpMooring}
              onChange={(e) => setField("helpMooring", e.target.checked)}
            />
            Help mooring on arrival
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.helpSlipping}
              onChange={(e) => setField("helpSlipping", e.target.checked)}
            />
            Help slipping lines on departure
          </label>
        </div>
        <p className="mt-4 text-xs text-ink-muted">
          Extras chosen in Price estimate &amp; extras:{" "}
          {[
            form.shorePower ? `shore power${form.amperage ? ` (${form.amperage}A)` : ""}` : "",
            form.water ? "water" : "",
            form.pumpOut ? "pump-out" : "",
            form.fuel ? "fuel" : "",
            form.laundry ? "laundry" : "",
          ]
            .filter(Boolean)
            .join(", ") || "none"}
          .
        </p>
      </fieldset>
    </>
  );
}
