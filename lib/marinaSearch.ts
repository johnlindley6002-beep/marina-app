import {
  classifyBoatLength,
  marinas,
  type Marina,
} from "../data/marinas";

const normalise = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

function haystack(marina: Marina): string {
  return normalise(
    [
      marina.name,
      marina.location,
      marina.region,
      marina.country,
      marina.countrySlug,
    ].join(" ")
  );
}

export type MarinaFilters = { q?: string; length?: number };

// Every word in the query must appear somewhere in the marina's name,
// location, region or country. A length filter keeps marinas that have a
// berth class for that length (dates are carried to the marina page; there
// is no per-marina availability data to filter on).
export function searchMarinas(filters: MarinaFilters): Marina[] {
  const words = normalise(filters.q ?? "")
    .split(/\s+/)
    .filter(Boolean);
  return marinas.filter((marina) => {
    if (words.length > 0) {
      const text = haystack(marina);
      if (!words.every((w) => text.includes(w))) return false;
    }
    if (filters.length && filters.length > 0) {
      if (classifyBoatLength(filters.length) === null) return false;
    }
    return true;
  });
}

export type Suggestion = {
  id: string;
  label: string;
  detail: string;
  kind: "marina" | "region" | "country";
};

// Suggestions are derived from marina data, so new marinas appear automatically.
export function getSuggestions(query: string, limit = 6): Suggestion[] {
  const q = normalise(query);
  const all: Suggestion[] = [];
  const seen = new Set<string>();
  const add = (s: Suggestion) => {
    if (seen.has(s.id)) return;
    seen.add(s.id);
    all.push(s);
  };

  [...marinas]
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
    .forEach((m) =>
      add({
        id: `marina:${m.id}`,
        label: m.name,
        detail: m.location,
        kind: "marina",
      })
    );
  marinas.forEach((m) => {
    add({
      id: `region:${m.region}`,
      label: m.region,
      detail: m.country,
      kind: "region",
    });
    add({
      id: `country:${m.countrySlug}`,
      label: m.country,
      detail: "Country",
      kind: "country",
    });
  });

  const matches = q
    ? all.filter((s) => normalise(`${s.label} ${s.detail}`).includes(q))
    : all;
  return matches.slice(0, limit);
}
