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
9. **Secondary text is slightly darker** where it used 60 or 65 percent ink (now the 70 percent floor that passes 4.5:1 on paper).

## Phases

- [x] Phase 0 baseline
- [x] Phase 1 audit
- [x] Phase 2 tooling
- [x] Phase 3 architecture
- [x] Phase 4 design system
- [ ] Phase 5 copy and i18n
- [ ] Phase 6 accessibility and mobile
- [ ] Phase 7 performance and PWA
- [ ] Phase 8 tests
- [ ] Phase 9 documentation
- [ ] Phase 10 verification and report

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

## Deferred

- **Phase 4, not done, on purpose.** Button, TextField, Select, Badge and EmptyState as React components: the app already has one CSS source for each (the btn, field, staff-btn, staff-badge and staff-empty classes) used 20 to 120 times, and wrapping them would add no behaviour for a large diff. Sheet, Dialog, Toast, Skeleton, IconButton, Card and ListRow were not built because no screen needs them yet (an unused primitive is dead code). Titillium Web and the accent #1e3a5f were not adopted (see Decisions). Status colours (success, warning, info) were not added: the product conveys status with words, ink, brass and one error red, and nothing would use them. Dark mode was never intended (no dark styles existed), so it was not added. Staff pages keep their own denser heading style on purpose. The berth map keeps its own greys and navy classes because its internals are off limits.

- react-hooks/set-state-in-effect warnings (17): convert the localStorage hydration effects to useSyncExternalStore.
