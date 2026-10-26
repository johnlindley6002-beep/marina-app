# Quality pass: final report

Branch `quality/devibe`, 56 commits on top of `main`. Nothing was pushed or merged. The working tree holds only `public/images/boatyard.svg` and `public/images/pier.svg`, which stay out of commits as agreed.

`npm run check` passes from a clean install (`rm -rf node_modules`, `npm ci`): types, lint (0 errors), copy check, i18n check, formatting, 93 unit and component tests, production build. `npm run test:e2e` passes: 53 tests on a 390 by 844 phone and a 1280 desktop (one is desktop only).

## Ten things that changed

1. **Guardrails.** Strict TypeScript flags, ESLint 9 with the React rules, Prettier, knip, a copy check (no em dashes, filler or exclamation marks), an i18n check, CI, and one `npm run check` gate. Before, there was no lint, no tests and no CI.
2. **Structure.** `app/` holds routes only. Code lives in `features/<area>`, `components/{ui,layout,providers}`, `lib/` and `data/`. The 2,417-line mock file, the 1,492-line dictionary and the 1,524-line enquiry form are split into small files. The UI reaches data only through `lib/data`, which is where Supabase will plug in.
3. **One source for the rules.** Money is whole cents with VAT rounded once. Dates are calendar days handled in UTC, with "today" in Lisbon. One country module. One tariff and class rule used by the marina page and the pre-arrival quote.
4. **Design system.** Tokens for radius, elevation, motion and text steps. Scroll reveals, parallax, hero animations, chart dividers and gradients are gone. New primitives: Field, SegmentedControl, Toggle, ProgressSteps. Safe-area padding and `dvh`.
5. **Four languages, for real.** Spanish and French are complete (a third of the pre-arrival form used to fall back to English). 786 keys, checked for parity, unused keys and copies of English. Plurals, dates, times and euros follow the language. Emails to the marina are in English or Portuguese.
6. **Accessibility.** axe finds no serious or critical problem on any of the 17 routes at either size. Input borders and grey hints now pass contrast, fields keep a focus ring, errors are linked to their fields, scrollable tables are keyboard reachable, phones get the right keyboard.
7. **Speed.** The PDF library (about 176 KB gzip) and the three non-English dictionaries load only when needed. Security headers, a service worker that no longer caches signed-in pages, and the PWA metadata are in place.
8. **Tests.** 93 unit and component tests with values written by hand from the tariff and rules, plus 53 end-to-end tests. They found four real rule bugs, now fixed.
9. **Honesty.** The persona switcher and the scenario page no longer ship in production. Simulated availability is labelled demo. The Google reviews block still shows nothing without real data.
10. **Docs.** A real README, `docs/architecture.md` (data flow, the rules and their sources, open questions for the marina) and a `CLAUDE.md` with the rules for future sessions.

## Before and after

|                          | Before                                     | After                                                 |
| ------------------------ | ------------------------------------------ | ----------------------------------------------------- |
| Lint                     | none installed                             | 0 errors, 16 warnings (listed under Deferred)         |
| Tests                    | none                                       | 93 unit and component, 53 end-to-end                  |
| TypeScript               | strict, 0 errors                           | stricter flags, 0 errors                              |
| Largest source file      | 2,417 lines (mock layer)                   | 978 lines (`data/marinas.ts`, marina facts)           |
| Spanish and French       | about a third translated                   | complete                                              |
| i18n keys checked        | 0                                          | 786, four languages                                   |
| Dead code                | knip not run, 5 unused SVGs                | knip clean, SVGs removed                              |
| Production dev tools     | live                                       | off unless `NEXT_PUBLIC_ENABLE_DEV_TOOLS=1`           |
| Security headers         | none                                       | CSP, nosniff, frame deny, referrer, permissions, HSTS |
| axe, serious or critical | not measured; first run failed on 3 routes | 0 on 17 routes at two sizes                           |

First-load JavaScript, gzip over the wire, phone viewport:

| Route                                 | Before | After  |
| ------------------------------------- | ------ | ------ |
| /                                     | 236 KB | 207 KB |
| /marinas                              | 241 KB | 212 KB |
| /marinas/portugal/cascais             | 263 KB | 237 KB |
| /marinas/portugal/cascais/pre-arrival | 511 KB | 308 KB |
| /my-boat                              | 519 KB | 320 KB |
| /account                              | 516 KB | 202 KB |

The Next.js and React runtime is about 135 KB of every number above, which is why 150 KB is not reachable here.

Screenshots of 17 routes at 375, 768 and 1280 px, before and after, are in `docs/audit/screens`. No page scrolls sideways at any size.

## Behaviour changes you should know about

The full list, with reasons, is in `docs/audit/PROGRESS.md` under Behaviour changes. The ones a user could notice:

- The dev tools are hidden in production. To demo the owner and staff areas on a hosted preview, set `NEXT_PUBLIC_ENABLE_DEV_TOOLS=1` at build time.
- Insurance follows the navigation zone (DL 93/2018 art. 33), not the berth class.
- The marina page estimate uses the larger of length class and beam class, so a 9.5 m boat with a 4.2 m beam is class IV. A boat over 45 m or wider than 10 m gets "ask the marina" instead of a class IX price. A catamaran in the enquiry form pays the multihull rate.
- The staff relet queue starts with the last 2 nights before the holder returns unticked.
- Submitted check-ins (they hold passport numbers) are removed from the device 30 days after the stay.
- Money shows in the language's own format (12,50 € in Portuguese). Quotes can differ by one cent from before, always toward the correct half-up value.
- The look is quieter: no reveal or parallax motion, a plain hairline in place of the chart divider, no empty navy band when there is no photo.
- The home contact email was navy on navy, so it was invisible. It is readable now.
- Emails to the marina are written in Portuguese when the interface is Portuguese.
- Gibraltar is in the country list, outside the EU and Schengen.

## Deferred, and why

- **Owner reletting flow and `data/site.ts` copy (about 90 strings).** The file says the wording needs legal review, so it was not translated first.
- **Staff back office (about 130 strings).** English only. Say if you want it in Portuguese.
- **Marina prose** (location, entry note, protection reason, cancellation policy, checklist, emergency labels, nearby places) is English only. The data has no Portuguese, Spanish or French slot for it, and the marina should supply the text.
- **Country names in selects** stay in English; showing them in the visitor's language needs a name to ISO table.
- **Page titles and meta descriptions** are English (no per-language routes).
- **Berth map.** Off limits as agreed. Known gaps: three English labels and `role="img"` around focusable berths (one attribute, `role="group"`).
- **16 lint warnings**, all `set-state-in-effect`: screens load saved data after mount to keep server and client output equal. `useSyncExternalStore` is the clean fix.
- **Not built:** Button, TextField, Select, Badge and EmptyState as components (the CSS classes are already one source), Sheet, Dialog, Toast, Skeleton, dark mode, `enterKeyHint`, Lighthouse runs.
- **Brand.** The brief named Titillium Web and `#1e3a5f`; the app keeps Archivo, Inter and `#16304f`. See Decisions in `PROGRESS.md`.
- **New dev dependencies** beyond the allowed list, open to your veto: `eslint` and `eslint-config-next`, `@axe-core/playwright`, `@types/node` 24.

## Next steps

1. Confirm with the marina the open questions in `docs/architecture.md`: Latitude 32 fields, the notice rule for a marina-led relet, the 150, 300 and 500 EUR fee, the relet numbers, the return buffer, busy months.
2. Have counsel review the relet copy and the terms page, then translate them.
3. Supply real photos, the real contact details and the Google listing values.
4. Before a backend: nonce-based CSP, row-level security for owner and staff actions, `zod/mini` if the pre-arrival bundle matters, and a country name table.
5. Run Lighthouse in CI rather than on this machine.
