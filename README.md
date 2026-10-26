# aldock

aldock helps boaters find a berth at a marina in Portugal, tell the marina about their boat and crew before they arrive, and keep their details in one place. It starts with Marina de Cascais. Berth holders can offer their berth for reletting while they are away, and marina staff handle arrivals, enquiries and relet approvals. Everything is a front-end mock: there is no server, the data lives in the browser, and an enquiry is sent by the visitor's own email app.

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript 5.9 in strict mode, Tailwind CSS 4, Zod 4 for the pre-arrival schema, pdf-lib for the generated PDFs. Tests: Vitest with Testing Library, and Playwright with axe. Tooling: ESLint 9, Prettier, knip.

Next.js 16 differs from what many people remember. Read the guides in `node_modules/next/dist/docs/` before changing framework-level code.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Sign-in is mocked. In development a small switcher at the bottom left lets you sign in as a sample voyager, owner or staff member. A production build hides it and the `/dev` pages unless `NEXT_PUBLIC_ENABLE_DEV_TOOLS=1` is set at build time (set it to demo the owner and staff areas on a hosted preview).

## Scripts

| Script               | What it does                                                           |
| -------------------- | ---------------------------------------------------------------------- |
| `npm run check`      | The gate: types, lint, copy and i18n checks, formatting, tests, build  |
| `npm run typecheck`  | `tsc --noEmit`                                                         |
| `npm run lint`       | ESLint                                                                 |
| `npm run format`     | Prettier (write)                                                       |
| `npm run check:copy` | Fails on em dashes, filler words and exclamation marks                 |
| `npm run check:i18n` | Fails when the four languages are out of step                          |
| `npm run test`       | Unit and component tests                                               |
| `npm run test:e2e`   | Playwright journeys and axe on every route (builds and serves on 3100) |
| `npm run knip`       | Finds unused files, exports and dependencies                           |

Other scripts: `node scripts/screens.mjs <label>` takes screenshots of every route at 375, 768 and 1280 px into `docs/audit/screens`, and `node scripts/measure-js.mjs` reports first-load JavaScript per route against a running production server.

## Folder structure

```
app/                  routes only: each page.tsx is thin and renders a feature component
features/<area>/      components/ and lib/ for one area
  account, dev, discovery, marina, my-boat, owner, prearrival, staff
components/
  layout/             navbar, footer, page header, role gate
  providers/          language, units, boats, auth, and the useFormat hook
  ui/                 primitives: Field, SegmentedControl, Toggle, ProgressSteps, Disclosure ...
data/                 marina and berth facts (language-free where possible), and mock/ below
data/mock/            the mock store: storage, accounts, reletting, enquiries, berth status, pre-arrival
lib/data/             the repository: the only door the UI uses to read or write mock data
lib/i18n/             dictionaries (one folder per language), plural and format helpers, email text
lib/                  dates, money (integer cents), units, countries, geo, dev-tools flag
scripts/              check-copy, check-i18n, screens, measure-js
tests/                unit/, helpers/, e2e/
docs/                 architecture.md and the quality audit in docs/audit
```

## Where the mocks live, and how Supabase replaces them

Everything the UI reads or writes goes through `lib/data/index.ts`, which re-exports a fixed list of functions from `data/mock/*`. The mock bodies read and write `localStorage` (always inside try and catch) and fire an `aldock-mock-changed` event so screens stay in step. To move to Supabase, keep the exported names and types and replace the bodies behind them with calls to the backend. Nothing outside `data/mock` and `lib/data` should know where the data comes from. Row-level security has to enforce what the mock only hides: only the holder of a berth may relet it, and only staff of a marina may decide on a request.

## Design tokens

All tokens live in `app/globals.css`.

- **Colour:** ink `#0a1a2f`, ink-2 `#16304f`, paper `#eef1f0`, stone `#b9c2c0`, brass `#c7a15b` (the one accent), error `#b3261e`. Text steps: `text-ink`, `text-ink-soft` (80%), `text-ink-muted` (70%, the lowest that passes 4.5:1 on paper). Input borders use `--control-border` (3:1).
- **Type:** Archivo (expanded for display) and Inter, with the `type-*` classes for titles. Inputs are 16 px on phones.
- **Spacing:** Tailwind's 4 px grid. Page gutters are 20 px on phones and 32 px from 768 px, content is 72 rem wide.
- **Radius:** `rounded-sm` 2 px, `rounded-md` 3 px, `rounded-lg` 4 px, `rounded-full` for pills.
- **Elevation:** `shadow-raised` for tools, `shadow-overlay` for menus. Nothing else casts a shadow.
- **Motion:** 150, 220 and 320 ms and one easing, all off under `prefers-reduced-motion`.
- There is no dark mode. It was never intended.

## Language rules

The site is in English, Portuguese (European), Spanish and French, and only those. Every user-facing string, including `aria-label` and `alt` text, comes from `lib/i18n`. English is the source: `lib/i18n/locales/en/<area>.ts` defines the shape, and the other languages must match it key for key. `npm run check:i18n` fails on a missing or extra key, an unused key, or a value left identical to English (shared words go in `scripts/i18n-same-as-english.json`). Dates, times, money and plurals go through `useFormat` and `lib/i18n/format.ts`, never by hand. Emails to the marina are written in English or Portuguese (`lib/i18n/mail.ts`). The staff back office, the owner reletting flow and the dev tools are English only for now (see `docs/audit/PROGRESS.md`, Deferred).

## No em dashes

No em dash (U+2014) anywhere: not in the interface, data, comments, commit messages or docs. A spaced en dash counts too. `npm run check:copy` enforces it, along with a short list of marketing filler words and exclamation marks.

## Tests

`npm run test` runs the unit and component tests. Expected values in the tariff, rules and relet tests were written by hand from the published rules, not copied from the code. `npm run test:e2e` builds the app, serves it on port 3100 with the dev tools on, and runs the journeys and the axe checks on a phone (390 by 844) and a desktop.
