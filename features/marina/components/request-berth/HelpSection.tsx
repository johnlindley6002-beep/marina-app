"use client";

import { useEffect, useState } from "react";
import { slotBusyness, type HelpReason, type SlotBusyness } from "@/lib/data";
import { formatClock, lisbonToIso } from "@/lib/lisbonTime";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { inputClass, labelClass } from "./shared";
import type { RequestBerthCtx } from "./useRequestBerthForm";

const REASONS: HelpReason[] = ["short_handed", "first_time", "other"];

// Help mooring on the arrival request, for a signed-in guest. Never refused:
// at a busy time the guest sees "Busy, you may wait" and quieter times to pick
// from, and may keep their own. Only busy or not is shown, never other boats.
export default function HelpSection({ ctx }: { ctx: RequestBerthCtx }) {
  const { accountMode, form, help, helpError, marina, setField, setHelp } = ctx;
  const { t, locale } = useLanguage();
  const copy = t.help;
  const [busyness, setBusyness] = useState<SlotBusyness | null>(null);
  const at = form.arrival && form.eta ? lisbonToIso(form.arrival, form.eta.slice(0, 5)) : null;

  useEffect(() => {
    if (!help.wanted || !at) {
      setBusyness(null);
      return;
    }
    let live = true;
    const timer = setTimeout(() => {
      void slotBusyness(marina.id, at).then((value) => {
        if (live) setBusyness(value);
      });
    }, 400);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [help.wanted, at, marina.id]);

  if (!accountMode) return null;
  const clockLocale = locale === "en" ? "en-GB" : locale;

  return (
    <fieldset>
      <legend className="type-heading text-xl text-ink">{copy.title}</legend>
      <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-base text-ink">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5"
          checked={help.wanted}
          onChange={(e) => setHelp({ ...help, wanted: e.target.checked })}
          aria-describedby="help-hint"
        />
        <span>{copy.wanted}</span>
      </label>
      <p id="help-hint" className="mt-1 text-sm text-ink-soft">
        {copy.wantedHint}
      </p>

      {help.wanted ? (
        <div className="mt-4 max-w-md space-y-4">
          <fieldset>
            <legend className={labelClass}>{copy.reason}</legend>
            {REASONS.map((reason) => (
              <label
                key={reason}
                className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-ink"
              >
                <input
                  type="radio"
                  name="help-reason"
                  className="h-5 w-5"
                  checked={help.reason === reason}
                  onChange={() => setHelp({ ...help, reason })}
                />
                {copy.reasons[reason]}
              </label>
            ))}
          </fieldset>
          <label className="block text-sm">
            <span className={labelClass}>{copy.note}</span>
            <input
              type="text"
              maxLength={200}
              value={help.note}
              onChange={(e) => setHelp({ ...help, note: e.target.value })}
              className={inputClass}
            />
          </label>
          {!at ? <p className="text-sm text-ink-soft">{copy.needsEta}</p> : null}
          <div role="status" className="text-sm">
            {busyness?.busy ? (
              <div>
                <p className="font-medium text-ink">{copy.busy}</p>
                {busyness.quieter.length > 0 ? (
                  <>
                    <p className="mt-1 text-ink-soft">{copy.quieter}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {busyness.quieter.map((slot) => {
                        const time = formatClock(slot, "en-GB");
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setField("eta", time)}
                            className="btn-quiet min-h-11"
                          >
                            {copy.useTime(formatClock(slot, clockLocale))}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </div>
            ) : busyness ? (
              <p className="text-ink-soft">{copy.roomy}</p>
            ) : null}
          </div>
        </div>
      ) : null}
      {helpError ? (
        <p role="alert" className="mt-2 text-sm text-error">
          {helpError}
        </p>
      ) : null}
    </fieldset>
  );
}
