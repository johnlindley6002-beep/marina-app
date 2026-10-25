# aldock quality audit

Branch: `quality/devibe`, cut from `feature/cascais-marina-data` at 29a8232.

## Phase 0: baseline

| Item | Value |
| --- | --- |
| Next.js | 16.2.9 (Turbopack) |
| React | 19.2.4 |
| Tailwind | 4.3.1 |
| TypeScript | 5.9.3 (`strict: true` already on) |
| Zod | 4.6.5 |
| `npx tsc --noEmit` | 0 errors |
| `npm run build` | passes, 22 static pages, 1 warning (`metadataBase` not set) |
| Lint | **No ESLint installed, no config, no `lint` script.** `next lint` was removed in Next 16. There is no lint baseline to record. |
| Tests | None. No test runner, no Playwright, no CI. |
| Tracked files in app/ lib/ data/ | 145 |
| `any` (word match, excluding comment lines) | 5 |
| `@ts-ignore`, `@ts-expect-error`, `as unknown as` | 1 |

Next 16 build output does not print per-route JS sizes. First-load JS is measured separately in Phase 7.

### Premises in the brief that did not match the repo

1. **Brand.** The brief says Titillium Web, primary `#0a1a2f`, accent `#1e3a5f`. The repo uses Archivo (display) and Inter (body), ink `#0A1A2F` (matches), ink-2 `#16304F`, paper `#EEF1F0`, stone `#B9C2C0` and a single brass accent `#C7A15B`. There is no Titillium Web and no `#1e3a5f`. Decision: keep what exists (see PROGRESS.md "Decisions for you").
2. **ESLint.** "Keep the Next.js ESLint config" assumes one exists. None does.
3. **Snapshot commit.** The only uncommitted files are `public/images/boatyard.svg` and `public/images/pier.svg`, which standing instructions say must stay out of commits. No snapshot commit was made.
4. **Berth map.** Standing instruction: do not edit `BerthAvailabilityMap.tsx` internals beyond the approved additive modes, and keep `data/berths.ts` untouched. Phases that touch the map are limited to wrappers, lazy loading and hit areas outside its internals.

## Inventory

### Routes (app/)

| Route | Kind | Purpose |
| --- | --- | --- |
| `/` | static | Home: search, featured marina |
| `/marinas` | dynamic | Search results |
| `/marinas/[country]` | SSG | Marinas in a country |
| `/marinas/[country]/[marina]` | dynamic | Marina page (Cascais) |
| `/marinas/[country]/[marina]/pre-arrival` | SSG | Six-step boater pre-arrival wizard |
| `/my-boat` | static | Boat hub, documents, upcoming stays, saved data |
| `/account` | static | Mock sign-in profile |
| `/owner`, `/owner/relet` | static | Berth holder home and reletting wizard |
| `/staff`, `/staff/arrivals`, `/staff/berths`, `/staff/checkin`, `/staff/enquiries`, `/staff/records`, `/staff/reletting` | static | Marina back office |
| `/legal/reletting-terms` | static | Placeholder legal copy |
| `/dev/prearrival-scenarios` | static | Seed scenario loader (dev tool, currently reachable in production) |
| `/manifest.webmanifest` | static | PWA manifest |

### Large files (over 300 lines)

| Lines | KB | File |
| --- | --- | --- |
| 2417 | 80.6 | `lib/mockData.ts` (accounts, reletting, enquiries, berth status, pre-arrival, all in one) |
| 1524 | 54.1 | `app/marinas/[country]/[marina]/RequestBerthForm.tsx` |
| 1492 | 56.3 | `lib/i18n.ts` (types, EN, PT, partial ES, partial FR in one file) |
| 1026 | 36.4 | `data/marinas.ts` (types, tariff, helpers, Cascais content) |
| 783 | 17.4 | `app/globals.css` |
| 649 | 22.4 | `app/marinas/[country]/[marina]/BerthAvailabilityMap.tsx` (off limits except additive modes) |
| 619 | 21.0 | `app/owner/relet/RelettingWizard.tsx` |
| 429 | 13.7 | `lib/prearrival/schema.ts` |
| 418 | 15.0 | `app/staff/reletting/RelettingQueue.tsx` |
| 392 | 15.0 | `app/my-boat/MyBoatContent.tsx` |
| 345 | 13.9 | `app/marinas/[country]/[marina]/pre-arrival/StepBoat.tsx` |
| 338 | 11.0 | `app/owner/RelettingLedger.tsx` |
| 327 | 9.7 | `data/berths.ts` (untouchable) |
| 319 | 11.2 | `app/marinas/[country]/[marina]/PriceEstimate.tsx` |
| 310 | 11.4 | `app/staff/arrivals/ArrivalsBoard.tsx` |
| 303 | 10.3 | `app/marinas/[country]/[marina]/CascaisPageContent.tsx` |

### lib/

| Module | Purpose |
| --- | --- |
| `mockData.ts` | The mock "backend": accounts, roles, berth links, reletting, enquiries, out-of-service, berth status, pre-arrival drafts and check-ins |
| `i18n.ts` | Dictionary type, EN and PT in full, ES and FR partial, merge helper |
| `boatProfile.ts` | Saved boats, skipper, frequent crew, clear-all (localStorage) |
| `countries.ts`, `prearrival/countries.ts` | Two country lists (duplicate, merged in Phase 3) |
| `prearrival/schema.ts` | Zod schemas and inferred types for the wizard (single source of truth) |
| `prearrival/pricing.ts`, `documentRules.ts`, `warnings.ts`, `readiness.ts`, `mask.ts` | Pure wizard logic |
| `prearrival/seedScenarios.ts` | Eight dev scenarios |
| `documents/*` | pdf-lib generators, authority report, download helper |
| `tripStore.ts`, `stayPlan.ts` | Trip and plan-your-stay state |
| `formatDate.ts`, `units.ts`, `geo.ts`, `marinaSearch.ts`, `protection.ts`, `googleReviews.ts`, `simulatedAvailability.ts` | Small helpers |
| `useMock.ts`, `useParallax.ts` | Hooks |

### Components (app/components and route-local)

Shared: AccountMenu, AppChrome, AuthProvider, BoatProvider, BoatSwitcher, Breadcrumbs, ChartDivider, ChartLinework, DestinationSearch, DevPersonaSwitcher, Disclosure, DocumentButtons, FavouriteButton, FeaturedMarina, FlagIcon, Footer, HomeContent, LanguageProvider, LanguageSelect, LastUpdated, LengthInput, MarinaRow, ModeSwitch, Navbar, PageHeader, ProtectionIndicator, RestingBand, Reveal, RoleGate, SavedMarinas, ServiceWorkerRegister, ShareButton, StatusChip, UnitSegmented, UnitsProvider.

Marina page: AboutMarina, ApproachInfo, ArrivalActions, BerthAvailabilityMap, CascaisPageContent, ContactBlock, ContactDock, DocumentWallet, EmergencyNumbers, FacilitiesGrid, FuelPrices, GoogleReviewsBlock, KeyFactsStrip, Lightbox, MarinaHero, NearbyPlaces, OfflineCard, PhotoGallery, PlanYourStay, PriceEstimate, RequestBerthForm, StayDecisionSummary, StayRecap, VesselUseFields, facility-icons.

Pre-arrival wizard: PreArrivalWizard, StepBoat, StepVoyage, StepCrew, PersonCard, StepDocuments, StepStay, StepReview, Confirmation, WizardBits.

Owner: OwnerContent, OwnerCalendar, OwnerUpdates, RelettingLedger, RelettingWizard. Staff: StaffShell, BerthPicker, ArrivalsBoard, PreArrivalArrivals, BerthOperations, CheckInFlow, EnquiryInbox, RecordsBrowser, RelettingQueue. My boat: MyBoatContent, BoatEditor, UpcomingStays.

### public/

498 KB. `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` are create-next-app leftovers. `cascais-marina-plan.webp` is 275 KB. `sw.js` is a service worker (reviewed in Phase 7).

## Phase 1: findings

Method: targeted searches across all of `app/`, `lib/` and `data/` for each category, then a full read of the files the searches pointed at (globals.css, layout, the dialogs, the service worker, the manifest, Reveal, the reviews and fuel blocks, plus the reletting and staff screens known from earlier work). This is evidence based, not a line-by-line read of every one of the 145 files. Categories where a search can prove absence (emoji, `dangerouslySetInnerHTML`, `<img>`, `any`, em dashes) are conclusive.

Overall read: the earlier art-direction and consistency passes already removed most of the "vibe" tells (no emoji, no glassmorphism, no `any`, no invented ratings, no `<img>`, no em dashes). The real gaps are tooling, i18n coverage, accessibility details on inputs and touch, money maths, monolith files and dev tools reachable in production.

### A. Vibe-coded tells

| Sev | Where | Finding | Fix |
| --- | --- | --- | --- |
| med | `app/components/Reveal.tsx`, used in `HomeContent.tsx:97-136`, `FeaturedMarina.tsx:74-112`, `AboutMarina.tsx:23-35`, `ApproachInfo.tsx:43-47`, `CascaisPageContent.tsx:270` | Scroll reveal (0.9 s fade and rise) on static headlines and paragraphs. | Delete `Reveal`, render children directly. |
| med | `lib/useParallax.ts`, `MarinaHero.tsx:30` | Parallax on the hero photo. | Delete, keep the hero static. |
| low | `HomeContent.tsx:19`, `FeaturedMarina.tsx:35`, `RestingBand.tsx:13`, `MarinaHero.tsx:35,55` | `bg-gradient-to-br from-ink to-ink-2` as the placeholder until real photos exist, and an `ink/55 to ink/90` scrim over the hero photo for text contrast. Functional, not decorative. | Keep, document as placeholder and scrim. |
| low | `AccountMenu.tsx:122`, `DevPersonaSwitcher.tsx:31,92`, `ContactDock.tsx:106`, `globals.css --lift` | `shadow-lg` on four elements plus the `--lift` surface shadow: three elevation recipes. | Two named elevation tokens. |
| low | many files | `rounded-[3px]` used about 25 times and `rounded-[2px]` about 8: radius is a magic number, not a token. | Radius tokens (small, medium, large). |
| low | about 45 arbitrary values (`[10rem]`, `[13rem]`, `[160px]`, `[480px]`, `[62px]` in `MarinaHero.tsx:100`, `[226rem]` in `CascaisPageContent.tsx:48`) | One-off sizes. Most are layout caps, not spacing. | Replace spacing ones with scale values, leave caps. |
| low | `UpcomingStays.tsx:49,55`, `BerthAvailabilityMap.tsx` | Hex colours hard-coded outside the theme (the map is off limits). | Use `currentColor` and tokens. |
| low | `RequestBerthForm.tsx:1518` | "Copied!" exclamation. | "Copied". |
| none | whole repo | Emoji: none. Filler words: none. Fake ratings or urgency: none (`GoogleReviewsBlock` renders nothing without real data). Lorem or placeholder names: none. | n/a |
| med | `lib/simulatedAvailability.ts`, `StayDecisionSummary.tsx:162-166` | "Yes, berths show as available" is built from a hash of the berth id, not real availability. The map labels itself illustrative (`t.berthSearch.illustrative`) but the summary headline does not. | Label the headline as illustrative. |

### B. Architecture

| Sev | Where | Finding |
| --- | --- | --- |
| high | `lib/mockData.ts` (2417 lines) | Accounts, roles, reletting, enquiries, out-of-service, berth status, pre-arrival and notifications in one file. Components import it directly (35+ imports), so there is no seam for a real backend. |
| high | `lib/i18n.ts` (1492 lines) | Type, EN, PT and partial ES and FR in one file. A missing key in ES or FR is invisible because `mergeDictionary` falls back to English. |
| high | `RequestBerthForm.tsx` (1524 lines) | One component for enquiry, vessel use, crew, documents, services and the mailto output. Used once, from `CascaisPageContent.tsx:227`. |
| med | `lib/countries.ts` and `lib/prearrival/countries.ts` | Two country modules (list in one, EU and Schengen sets in the other), importers split across both. |
| med | `data/marinas.ts` (1026 lines) | Types, tariff constants, helpers and the Cascais content in one file. |
| med | `RelettingWizard.tsx` (619), `RelettingQueue.tsx` (418), `MyBoatContent.tsx` (392) | Long, but each is one flow. Split only where cheap. |
| med | 80 files under app and lib are `"use client"` | Several are purely presentational (`StatusChip`, `LastUpdated`, `ChartDivider`) and can be server components. Pages themselves are thin, which is good. |
| low | `lib/boatProfile.ts` vs `lib/prearrival/schema.ts` | Two shapes for "a boat" (`SavedBoat`, `BoatIdentity` plus `BoatSpecs`) with a hand-written mapping in `StepBoat.tsx` and `Confirmation.tsx`. Deliberate (the profile hub predates the wizard) but a drift risk. |

### C. TypeScript

Strict mode is already on and `tsc` is clean. No explicit `any` (the five word matches are English prose). One `as unknown as` (`lib/documents/download.ts`, for `BlobPart`). About 28 `as X` casts, mostly on `localStorage` JSON and `event.target.value`. `noUncheckedIndexedAccess` is off; enabling it is Phase 2.

### D. Correctness

| Sev | Where | Finding |
| --- | --- | --- |
| high | `lib/prearrival/pricing.ts:103-112`, `data/marinas.ts calculateQuote`, `lib/mockData.ts:607 cents()` | Money is float. VAT is `subtotal * 0.23`, rounded only at display. Over a sample of 28,000 subtotals, `toFixed(2)` of the float VAT disagreed with half-up cents in 60 cases (a cent off). Fix with integer cents. |
| med | `lib/formatDate.ts`, `OwnerCalendar.tsx:50-58`, `RelettingWizard.tsx:37`, `UpcomingStays.tsx:32` | "Today" is the device's local date, not Lisbon. A boater abroad near midnight sees a different "today". `todayIso` is duplicated in three places. |
| low | `getSeason(date)` | Uses local `getMonth()`. Fine because stays are built from local-midnight dates, but it depends on callers never passing a UTC date. Centralise in `lib/dates.ts`. |
| low | `Footer.tsx:75` | `new Date().getFullYear()` in render: mismatch only across New Year. |
| low | `ArrivalsBoard.tsx` `EventRow` | Calls `getBerthStatuses` (iterates every berth) once per row per render. |
| ok | `localStorage` access | All reads and writes are inside try/catch (`readJson`, `boatProfile`, `tripStore`, providers). |

### E. Accessibility

| Sev | Where | Finding |
| --- | --- | --- |
| high | `globals.css:368` `.field:focus { outline: none }` and `:563` `.staff-field:focus` | These beat the global `:focus-visible` ring (higher specificity), so every text input has only a 1 px border colour change as its focus cue. |
| med | `RequestBerthForm`, wizard steps | Errors are `role="alert"` in places, but on submit the first invalid field is not focused in most forms. |
| med | `FacilitiesGrid.tsx:88-110` | Hand-rolled modal. It has Escape, a Tab trap and return focus, but the close button is `aria-label="Close"` in English and a bare `×`. |
| med | `ContactDock.tsx:89` | `role="dialog"` without `aria-modal`; trap to verify. |
| med | Wizard steppers | `PreArrivalWizard` progress is `aria-hidden` bars plus a text line; no `aria-current="step"` list. |
| low | Contrast | `text-ink/65` (5.2:1) passes; `text-ink/60` (4.4:1) remains in `ProtectionIndicator`, `EnquiryInbox` and a few staff files. |
| ok | Semantics | No click handlers on `div` or `span`, no `<img>`, a skip link, `html lang` follows the selected locale, `Lightbox` uses native `<dialog>`. |

### F. Mobile and iOS

| Sev | Where | Finding |
| --- | --- | --- |
| high | `globals.css:358 .field` and `:242` | Input font is 14 px. The 16 px override applies only under 640 px, so iPads and large phones in landscape zoom on focus. Staff inputs are 14 px at every width. |
| high | whole app | `inputMode` appears 4 times and `autoComplete` almost never in forms (only `DestinationSearch` and `AccountContent`). No `enterKeyHint`. Wizard name, date of birth, email and phone fields have no hints. |
| high | whole app | No `env(safe-area-inset-*)` anywhere, and the viewport lacks `viewport-fit=cover`. `PreArrivalWizard.tsx:267` is a fixed bottom bar that sits on the iPhone home indicator. |
| med | `FacilitiesGrid.tsx:92` `max-h-[85vh]`, `StaffShell.tsx:25` `min-h-screen` | `vh` instead of `dvh`. |
| med | `globals.css:429,553,586` | Staff controls are 40 px by documented decision; below 44 px on touch. |

### G. Performance

| Sev | Where | Finding |
| --- | --- | --- |
| high | `DocumentButtons.tsx:5-8` | Statically imports the pdf-lib generators, so pdf-lib (about 190 KB minified) ships in every route that renders it (confirmation, My boat, staff arrivals). It should load on click. |
| low | `public/` | Five create-next-app SVGs unused; `cascais-marina-plan.webp` is 275 KB (served through `next/image`). |
| ok | Images, fonts, map | All images use `next/image`; fonts use `next/font` with the Latin subset only; the berth map and request form are already `dynamic`. |

### H. i18n

| Sev | Where | Finding |
| --- | --- | --- |
| high | 22 component files render hard-coded English | `RequestBerthForm`, `RelettingQueue`, `RelettingWizard`, `RelettingLedger`, `RecordsBrowser`, `PreArrivalArrivals`, `CheckInFlow`, `BerthOperations`, `ArrivalsBoard`, `EnquiryInbox`, `DocumentWallet`, `StayRecap`, `PlanYourStay`, `ContactBlock`, `AccountContent`, `VesselUseFields`, `OfflineCard`, `MarinaHero`, `GoogleReviewsBlock`, `FuelPrices`, `DevPersonaSwitcher`, the dev page. Staff screens are English by an earlier explicit decision; owner and boater screens are not. |
| high | `data/site.ts` | The reletting, hub and account copy is single-locale. |
| med | `lib/i18n.ts` | ES and FR cover roughly the page chrome and a subset of the wizard. They fall back to English silently. |
| low | `aria-label` strings such as "Close" | Hard-coded English. |

### I. Security and privacy

| Sev | Where | Finding |
| --- | --- | --- |
| high | `layout.tsx:61`, `DevPersonaSwitcher.tsx:21`, `app/dev/prearrival-scenarios` | The persona switcher (including "sign in as marina staff") and the scenario loader are live whenever `siteConfig.mockMode` is true, which it is in production builds. |
| med | `lib/mockData.ts` pre-arrival store | Submitted check-ins keep full passport and ID numbers in `localStorage` indefinitely. Nothing prunes them after the stay. |
| med | `next.config.ts` | No security headers (CSP, nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors). Only the image optimiser has a CSP. |
| low | `layout.tsx` | No `metadataBase` (build warning), so social image URLs resolve to localhost. |
| ok | Secrets | `.env.local` is gitignored and untracked. No `dangerouslySetInnerHTML`. ID numbers are masked on the staff board. |

### J. Dead code

`public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` (create-next-app leftovers). `README.md` is the create-next-app boilerplate (it mentions Geist). The unused-export report comes from knip in Phase 3.

### PWA

`public/sw.js` is a real network-first worker (HTML falls back to cache only when offline or after a 4 s timeout; versioned caches). It is not a placeholder and does not serve stale HTML after a deploy while online. The manifest has two icons, no maskable icon, no `apple-touch-icon`, and the viewport has no `viewport-fit=cover`.

## Top 20 fixes, ranked

1. Hide the persona switcher and `/dev` in production (env gated). (I)
2. Add ESLint, Prettier, Vitest, Playwright, CI and a `check` script. (tooling)
3. Money in integer cents, one `lib/money.ts`, VAT rounded once. (D)
4. Test the pricing and rule logic against the stated tariff. (tests)
5. Restore a visible focus ring on `.field` and `.staff-field`. (E)
6. 16 px inputs at every width; add `inputMode`, `autoComplete`, `enterKeyHint` to the wizard fields. (F)
7. Safe-area insets, `viewport-fit=cover`, `dvh` for the fixed bottom bar and dialogs. (F)
8. Lazy-load pdf-lib on click. (G)
9. Merge the two country modules. (B)
10. Split `mockData.ts` by domain behind a repository seam. (B)
11. Split `i18n.ts` per locale and namespace, with typed keys. (B, H)
12. Move owner, boater and reletting copy into i18n; add `check-i18n`. (H)
13. Split `RequestBerthForm` into small components. (B)
14. Remove `Reveal` and `useParallax`. (A)
15. Design tokens for radius, elevation and motion; small primitives in `components/ui`. (A)
16. Prune submitted check-ins after the stay. (I)
17. Security headers and `metadataBase`. (I)
18. Staff touch targets 44 px on coarse pointers. (F)
19. Label the "berths show as available" headline as illustrative. (A)
20. Delete create-next-app leftovers, rewrite the README. (J)
