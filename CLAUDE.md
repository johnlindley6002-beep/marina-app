@AGENTS.md

# Project rules for aldock

aldock is a marina booking and pre-arrival app for Portugal (Marina de Cascais first). Read `README.md` for the layout and `docs/architecture.md` for the rules the logic encodes. These are the rules to follow in every session.

## Before you commit

Run `npm run check`. It runs the type check, ESLint, the copy and i18n checks, the formatting check, the unit tests and a production build. Commit only when it passes. Run `npm run test:e2e` when you change a flow, a route or anything an axe check covers.

## Structure

- `app/` holds routes only. Each `page.tsx` is thin and renders a component from `features/`.
- `features/<area>/components` and `features/<area>/lib` hold the code for one area. Do not reach across areas for a component; move shared code to `components/` or `lib/`.
- `components/ui` holds the primitives (Field, SegmentedControl, Toggle, ProgressSteps, Disclosure, StatusChip). Use them before writing new markup. `components/layout` holds the shell, `components/providers` the context providers and `useFormat`.
- The UI reads and writes data only through `lib/data`. Do not import from `data/mock/*` in a component. `data/` holds marina facts and the mock store.
- Pure logic (pricing, rules, validation, formatting) lives in `lib/` or `features/<area>/lib`, not inside a component, and has a test.

## Design

- Use the tokens in `app/globals.css` and the classes built on them (`btn-primary`, `field`, `type-*`, `text-ink-soft`, `rounded-md`, `shadow-raised`). Do not add hex colours, arbitrary pixel values, new shadows or new durations.
- One primary action per screen, in brass. The look is calm: no gradients, glows, parallax or scroll-triggered animation.
- Keep the berth map's internals (`features/marina/components/BerthAvailabilityMap.tsx`) and `data/berths.ts` as they are. Only the approved additive `controlled` mode may change there.
- Inputs are at least 44 px tall and 16 px on phones, labelled with `Field` (or a label tied by `htmlFor`), with errors linked by `aria-describedby`. Every interactive element keeps the focus ring.

## Words

- Every user-facing string comes from `lib/i18n`, in all four languages (English, European Portuguese, Spanish, French), including `aria-label` and `alt`. Add the English key first, then the other three. `npm run check:i18n` must pass.
- Format dates, times, money and plurals with `useFormat` and `lib/i18n/format.ts`.
- No em dashes anywhere (strings, comments, docs, commit messages), no exclamation marks, no filler words. Sentence case. Verbs on buttons. Numbers with units.
- Never show a fake trust signal: no invented rating, review count, "only 2 left" or urgency message. Anything simulated is labelled as a demo or indicative. The Google reviews block shows only with real data above the minimum count.

## Money and dates

Money is whole cents internally (`lib/money.ts`), VAT is rounded once at the end. Dates are `YYYY-MM-DD` strings handled by `lib/dates.ts`; "today" is the Lisbon day. Do not use `Date` arithmetic or floating-point euros in new logic.

## Tests

A change to pricing, rules, validation, dates, money or the reletting logic needs a test, with the expected value written by hand from the stated rule. If the code disagrees with the rule, fix the code and say so.

## Local data

There is no backend. Storage is `localStorage` inside try and catch. Enquiries go out by `mailto:`. Keep `public/images/boatyard.svg` and `public/images/pier.svg` out of commits unless told otherwise. Do not push, merge or force anything.
