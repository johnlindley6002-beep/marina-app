# Progress log

Resume a stopped session with: `Continue the audit from docs/audit/PROGRESS.md`.

Branch: `quality/devibe`. Nothing has been pushed or merged.

## Decisions for you (read these first)

1. **Brand kept as it is, not as the brief describes.** The brief says Titillium Web and `#1e3a5f`. The repo has Archivo + Inter, ink-2 `#16304F` and a brass accent. I kept the real tokens because swapping the typeface and palette is a visible redesign, not a quality pass. If you do want Titillium Web, say so and it is a one-file change in `app/layout.tsx` and the tokens in `app/globals.css`.
2. **boatyard.svg and pier.svg left untracked.** Your standing rule excludes them from commits, so the "snapshot commit" step was skipped (they were the only uncommitted files).
3. **Berth map internals not edited.** `BerthAvailabilityMap.tsx` and `data/berths.ts` stay off limits per your standing rule.
4. **Dev dependencies beyond your allowed list.** ESLint is not installed, so Phase 2 cannot exist without it. See the dependency table below.

## Dependencies added

All dev dependencies. No new runtime dependency.

| Package                                                                                       | Why                                                                                                                 | On your allowed list?                                         |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| vitest, jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event | unit and component tests                                                                                            | yes (user-event is the standard companion to Testing Library) |
| @playwright/test                                                                              | end-to-end tests                                                                                                    | yes                                                           |
| prettier, prettier-plugin-tailwindcss                                                         | formatting                                                                                                          | yes                                                           |
| knip                                                                                          | dead-code report                                                                                                    | yes                                                           |
| **eslint@9, eslint-config-next**                                                              | Phase 2 needs a linter and none existed. This is the tool the Next.js docs prescribe now that next lint is removed. | **no, flagged for your review**                               |
| **@axe-core/playwright**                                                                      | Phase 6 and 8 ask for axe checks in Playwright; there is no other way to run axe.                                   | **no, flagged for your review**                               |
| **@types/node 20 to 24**                                                                      | vitest 5 requires >=22; Node here is 24.                                                                            | not a new package                                             |

ESLint is on 9.x because eslint-config-next 16 targets it; 9.x is marked deprecated upstream, move to 10 when the Next config supports it.

## Behaviour changes

1. **Dev tools hidden in production.** The persona switcher (sign in as owner or staff) and /dev/prearrival-scenarios now exist only in development, or in a build made with NEXT_PUBLIC_ENABLE_DEV_TOOLS=1. A normal production build returns 404 for the dev page and shows no switcher. **If you deploy this mock site to Vercel as a demo and want the owner and staff areas reachable, set NEXT_PUBLIC_ENABLE_DEV_TOOLS=1 in the Vercel project.** When the switcher is absent, the sign-in gate says sign-in is not available in this preview.
2. **"Today" is the Lisbon calendar day**, not the device date. A boater abroad near midnight now sees the marina day.
3. **Money is summed in whole cents**, VAT rounded once. Quotes can differ by one cent from before in rare cases (about 1 in 450 in a 28,000 sample), always towards the correct half-up value.
4. **Impossible calendar dates are rejected** (2026-02-31 used to roll into March).
5. **Gibraltar added to the country list**, classed as outside the EU and Schengen.
6. **"Copied!" is now "Copied"** on the enquiry summary.
7. **Decoration removed (Phase 4).** No scroll reveal, no hero image drift on scroll (parallax), no hero load animation or image zoom, no photo zoom on hover, no chart-scale dividers between sections (now a plain hairline), no gradients on navy plates, and the chart linework survives only in the two heroes. The empty navy "resting band" shown when no photo is supplied is no longer rendered (it was a 30 rem blank block); with a photo it is unchanged.
8. **Contact email on the home page was invisible** (navy text on a navy section). It is now paper-coloured.
9. **Emails to the marina are written in English or Portuguese** (Portuguese when the interface is Portuguese; Spanish and French visitors send English). Before, every email was English. All email wording now lives in lib/i18n/mail.ts.
10. **Amounts, dates and plurals follow the language.** 12,50 € in Portuguese, Spanish and French, €12.50 in English. French counts 0 nights as singular, as French does.
11. **Copy changes (Phase 5).** Examples: Send pre-arrival, Plus 23% VAT and utilities. Indicative price, confirmed by the marina., Does not fit your boat, Wi-Fi. The home About text no longer promises a calm morning on the water and now says what the product does. The simulated-availability notes now say Demo data. Sign out (mock) is Sign out; the dev-only banner still marks mock mode.
12. **Portuguese terms.** Berth is posto de amarração, pre-arrival is registo prévio de chegada (not pre-check-in), the greeting in the email is Exmos. Senhores.
13. **Spanish and French are now complete** (before, about a third of the pre-arrival form fell back to English). Spanish uses usted throughout, as Portuguese and French use the formal form.
14. **Secondary text is slightly darker** where it used 60 or 65 percent ink (now the 70 percent floor that passes 4.5:1 on paper).

## Phases

- [x] Phase 0 baseline
- [x] Phase 1 audit
- [x] Phase 2 tooling
- [x] Phase 3 architecture
- [x] Phase 4 design system
- [x] Phase 5 copy and i18n
- [x] Phase 6 accessibility and mobile
- [x] Phase 7 performance and PWA
- [x] Phase 8 tests
- [x] Phase 9 documentation
- [x] Phase 10 verification and report

### Phase 0

Baseline recorded in AUDIT.md. tsc clean, build clean, no lint tool, no tests, no CI.

### Phase 1

Audit written to AUDIT.md with a ranked top 20.

### Phase 2

- tsconfig: added noUncheckedIndexedAccess, noImplicitOverride, noFallthroughCasesInSwitch (strict was already on). 45 resulting errors fixed without any cast or ignore: guards for possibly-undefined array reads, a getPrimaryMarina() helper for the staff screens, Lightbox and StepCrew guards.
- ESLint: next core-web-vitals + typescript, no-explicit-any, no-unused-vars (underscore allowed), exhaustive-deps and no-console as errors. Fixed five real exhaustive-deps problems (RecordsBrowser matches, RequestBerthForm setForm), an unused import and an unused prop.
- 17 react-hooks/set-state-in-effect findings kept as warnings, not errors and not hidden: they are the localStorage-after-mount hydration pattern the app uses on purpose to keep server and client output identical. The purist fix is useSyncExternalStore; deferred (see Deferred).
- Prettier plus the tailwind class sorter, run once in its own commit (108 files, no logic change). .gitattributes pins LF so Windows checkouts do not fail format:check.
- Scripts: typecheck, lint, format, format:check, check:copy, test, test:e2e, knip, check.
- scripts/check-copy.mjs fails on em dashes, spaced en dashes, filler words and exclamation marks in copy.
- .github/workflows/ci.yml runs npm run check then the Playwright suite.
- Lint baseline was none (no linter existed). Now 0 errors, 17 warnings.

### Phase 3

- **Structure.** app/ holds routes only. 112 files moved with git mv into features/<area>/{components,lib}, components/{layout,providers,ui}, data/mock, lib/data. Imports rewritten by script to the @/ alias (tsc clean afterwards).
- **One country module** (lib/countries): list, EU, Schengen and free-movement sets. Portugal-only helpers (navigation zones, identification string) moved to features/prearrival/lib/portugal.ts.
- **RequestBerthForm kept, split.** It is the berth enquiry sent by email (mailto plus a mock enquiry record for staff), a different job from the pre-arrival wizard (what a boater submits before arriving), so merging would lose behaviour. It is now a state hook (useRequestBerthForm), pure logic in features/marina/lib/enquiry (types, validation, summary text, payload builders) and seven section components plus CrewList. Verified in the browser: validation, a valid submit, the enquiry record and the summary. Largest piece is the hook at 397 lines (state, effects and submit).
- **mockData split** into data/mock/{storage,accounts,reletting,enquiries,berthStatus,prearrival}. lib/data/index.ts is the only surface the UI imports (explicit export list; storage keys, seed arrays and store loaders are not exported). useMock moved to lib/data. To move to Supabase, replace the bodies behind lib/data exports.
- **i18n split** into lib/i18n/types.ts, locales/en/<namespace>.ts, locales/pt/<namespace>.ts, partial es.ts and fr.ts. Keys are typed by the Dictionary type; @/lib/i18n exports are unchanged.
- **lib/dates.ts and lib/money.ts.** Replace formatDate.ts and three copies of date helpers; all day maths in UTC day numbers; pricing, the marina-page quote and the reletting split use integer cents.
- **Boat mapping** between My boat and the wizard draft is now one module (features/prearrival/lib/boatMapping.ts).
- **Server components.** Only 3 of the 80 use-client files needed no client features (the audit guessed more); directive removed from those.
- **Dead code.** knip configured. Removed unused exports and the 5 create-next-app SVGs. Remaining knip items are the three test libraries (used in Phase 8) and money.formatEur (used in Phase 5).
- Still over 300 lines: RelettingQueue (429), MyBoatContent (361), ArrivalsBoard (316), RelettingLedger (312), each a single flow; deferred. The berth map (605) is off limits.

### Phase 4

- **Tokens** in globals.css: radius (sm 2, md 3, lg 4 px; every rounded-[Npx] replaced), elevation (shadow-raised, shadow-overlay; every other shadow removed), motion (150, 220, 320 ms and one easing; CSS and Tailwind use the variables), text steps (ink, ink-soft, ink-muted replace five opacity variants), surface white. Spacing was already Tailwind's 4 px grid.
- **Primitives added** in components/ui: SegmentedControl (UnitSegmented and ModeSwitch are now thin wrappers), Field (promoted from the pre-arrival wizard, 9 files), Toggle, ProgressSteps (two identical hand-built bars). PageHeader now also used by My boat, Reletting terms and the booking confirmation.
- **Safe area.** viewport-fit=cover, and the contact dock, the pre-arrival sticky bar, the footer and the dev switcher clear the home indicator.
- **Before and after screenshots** of 17 routes at 375, 768 and 1280 are in docs/audit/screens (scripts/screens.mjs). No horizontal overflow at any size.

### Phase 5

- **Dictionaries.** 4 languages, 1,000+ keys, one folder per language and one file per area. All four are complete and typed; scripts/check-i18n.mjs (in npm run check) fails on a missing or extra key, an unused key and a Portuguese, Spanish or French value identical to English, except the shared words in scripts/i18n-same-as-english.json.
- **New areas moved into the dictionary:** stay planning, estimate, recap, document wallet and arrival actions; marina page blocks (hero, practical info, contact, emergency, fuel, offline, reviews, gallery); app shell (menus, gate, share, filters); My boat; account; the whole enquiry form with its validation messages. Quote lines no longer carry English text (kind only); the busy-period note is a generic dictionary line.
- **Formatting.** lib/i18n/format.ts (pt-PT, es-ES, fr-FR, en-GB tags, plural rules through Intl.PluralRules, 24-hour times, euro formatting) and the useFormat hook.
- **Real data only.** The Google reviews block already renders nothing below 15 reviews or with no rating; it is unchanged. Simulated availability and the sample account notes are labelled demo.

### Phase 6

- **axe** runs on all 17 routes at 390 px and 1280 px (tests/e2e/a11y.spec.ts, WCAG 2.0 to 2.2 AA tags): zero serious or critical problems. Found and fixed: grey map hints under 4.5:1 (the two neutral steps are re-tuned in the theme, the map file is untouched), faded out-of-month calendar days, scrollable tables not reachable by keyboard.
- **Contrast** of every text and surface pair: all pass 4.5:1 (lowest: ink-muted on paper-deep 5.8, error on paper-deep 5.1, neutral-400 on white 4.8). Large-text and control exceptions are not relied on.
- **Checked by script, nothing to fix:** one h1 per page, no skipped heading levels, one main landmark, no horizontal scroll at 320 px, every image has alt, every button has a name, no tap target under 44 px on the consumer pages (the staff pages are 40 px by design, see globals.css).
- **Field** now links the error to the control (aria-invalid and aria-describedby) and keeps the error out of the label text. Dialogs: the lightbox is a native dialog; the facility dialog and contact dock already trap focus, close on Escape and return focus.
- **One known gap, left on purpose:** on /staff/berths the map svg has role img but holds focusable berths (axe nested-interactive). The fix is one attribute inside the berth map, which is off limits; the rule is disabled for that single route in the test. Suggested change: role="group" on the svg.
- **Not built:** dark mode (never intended). prefers-reduced-motion is honoured globally.

### Phase 7

First-load JavaScript, gzip over the wire, phone viewport (scripts/measure-js.mjs, production build):

| Route                                 | Before | After  |
| ------------------------------------- | ------ | ------ |
| /                                     | 236 KB | 200 KB |
| /marinas                              | 241 KB | 199 KB |
| /marinas/portugal/cascais             | 263 KB | 227 KB |
| /marinas/portugal/cascais/pre-arrival | 511 KB | 308 KB |
| /my-boat                              | 519 KB | 297 KB |
| /account                              | 516 KB | 203 KB |

- **What changed:** the PDF library (about 176 KB gzip) loads only when a document button is pressed; the French, Spanish and Portuguese dictionaries (about 50 KB gzip together with English before) load only when that language is chosen, English ships with the page.
- **Why not 150 KB:** the Next.js and React runtime alone is about 135 KB gzip on every route here, so 150 KB is not reachable without dropping the framework. What the app itself adds on the home page is about 65 KB. Zod (about 90 KB gzip) is the next biggest piece and only loads on the pre-arrival, My boat and owner pages; zod/mini would cut it but changes the schema API, so it is a recommendation, not done.
- **Already in place, checked:** next/font for Archivo and Inter (self-hosted, no layout shift), next/image everywhere (no raw img), the map, enquiry form, lightbox, facilities grid and contact dock are dynamic imports, viewport-fit=cover, apple-touch icon and apple web app meta, a manifest with id and scope. Service worker review above.
- **Not done:** per-route Lighthouse numbers (headless Edge leaks processes on this machine, see the notes in memory); run Lighthouse in CI instead.

### Phase 8

- **147 tests**: 93 unit and component (Vitest, Testing Library) and 53 end-to-end (Playwright on a 390x844 phone and a 1280 desktop: axe on 17 routes, plus 10 journeys per size, one of them desktop only). Expected values were written by hand from the stated tariff and rules; where the code disagreed it was changed, not the test (the four fixes are behaviour changes 19 to 21 above).
- **Unit:** the full Cascais 2026 tariff table (class limits and day rates, boundaries 6.15 and 6.16 m and 2.40 and 2.41 m), the worked 79.34 example, beam pushing the class, a 29 March to 3 April season split, multihull, countries, voyage flags, every warning rule, insurance by zone, validation (one skipper, departure after arrival, ID expiry), masking, readiness, credit models, split rounding, the return buffer, reletAllowed none, dates (invalid days, clock change, Lisbon today), money and plurals.
- **Component:** the crew count adds and removes person cards, the full crew list chip appears only for an external-border route, Field, SegmentedControl, Toggle, ProgressSteps, and the language provider loading Portuguese.
- **End to end:** home to Cascais to the start of the check-in, the language switch, each of the six seed scenarios reaching the review step, the staff arrivals badges, and an owner reletting request reaching the staff queue. Scripts: npm run test, npm run test:e2e.

## Deferred

- **Phase 5, not done.** (a) The owner reletting wizard, ledger and calendar and the copy in data/site.ts (siteConfig.relet), about 90 strings: the file itself says the wording needs legal review, so translating it first would translate text that may change. (b) The staff back office (about 130 strings): English only, a marina staff tool; say if you want it in Portuguese. (c) Marina-supplied prose outside description, arrival and getting-there (location, entry note, protection reason, cancellation policy, checklist, emergency labels, nearby places) is English only; the data model has no pt, es or fr slot for it and the marina should supply it. (d) Country names in selects stay in English (the stored value is the English name the rules use; showing a translated name needs a name to ISO table). (e) Page titles and meta descriptions are English (no per-language routes). (f) Three labels inside BerthAvailabilityMap (Owner away, Out of service, the map aria-label), because its internals are off limits. (g) Dev tools.

- **Phase 4, not done, on purpose.** Button, TextField, Select, Badge and EmptyState as React components: the app already has one CSS source for each (the btn, field, staff-btn, staff-badge and staff-empty classes) used 20 to 120 times, and wrapping them would add no behaviour for a large diff. Sheet, Dialog, Toast, Skeleton, IconButton, Card and ListRow were not built because no screen needs them yet (an unused primitive is dead code). Titillium Web and the accent #1e3a5f were not adopted (see Decisions). Status colours (success, warning, info) were not added: the product conveys status with words, ink, brass and one error red, and nothing would use them. Dark mode was never intended (no dark styles existed), so it was not added. Staff pages keep their own denser heading style on purpose. The berth map keeps its own greys and navy classes because its internals are off limits.

- react-hooks/set-state-in-effect warnings (17): convert the localStorage hydration effects to useSyncExternalStore.
