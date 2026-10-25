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
