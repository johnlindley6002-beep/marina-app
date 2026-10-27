// The radio and walk-in log: the checks on a quick entry.

export type RadioSource = "vhf" | "walk_in";

export type RadioEntryInput = {
  time: string;
  boatName: string;
  source: RadioSource;
  channel: string;
  request: string;
};

export type RadioEntryErrors = Partial<Record<"time" | "boatName" | "channel" | "request", true>>;

// VHF marine channels run from 1 to 88.
export function validRadioChannel(value: string): number | null {
  if (!/^\d{1,2}$/.test(value.trim())) return null;
  const n = Number(value);
  return n >= 1 && n <= 88 ? n : null;
}

export function validateRadioEntry(entry: RadioEntryInput): RadioEntryErrors {
  const errors: RadioEntryErrors = {};
  if (!/^\d{2}:\d{2}$/.test(entry.time)) errors.time = true;
  if (entry.boatName.trim() === "") errors.boatName = true;
  if (entry.request.trim() === "") errors.request = true;
  if (entry.source === "vhf" && validRadioChannel(entry.channel) === null) errors.channel = true;
  return errors;
}
