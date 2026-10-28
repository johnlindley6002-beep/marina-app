# aldock

aldock helps boaters find a berth at a marina in Portugal, tell the marina about their boat and crew before they arrive, and keep their details in one place. It starts with Marina de Cascais. Berth holders can offer their berth for reletting while they are away, and marina staff handle arrivals, enquiries and relet approvals. The whole app runs on Supabase with an email sign-in link: guests and berth holders sign in at `/login` (profile, boats, arrival requests, relet offers), and the staff back office (arrivals, reception, the berth planner and map, enquiries, relet approvals, customers, dock tasks and the radio log) is in English and Portuguese. The marina controls every berth: only staff can link a berth holder to a berth, confirm a guest into one, or approve a relet offer. Without a Supabase project the site falls back to a browser mock (see below).

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript 5.9 in strict mode, Tailwind CSS 4, Zod 4 for the pre-arrival schema, pdf-lib for the generated PDFs. Tests: Vitest with Testing Library, and Playwright with axe. Tooling: ESLint 9, Prettier, knip.

Next.js 16 differs from what many people remember. Read the guides in `node_modules/next/dist/docs/` before changing framework-level code.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Copy `.env.local.example` to `.env.local` and fill in the Supabase project URL and publishable key. The staff area signs in at `/staff/login` with a link sent by email; see "Supabase" below for setting up the database and the first admin.

Guests and berth holders sign in at `/login` with a link sent by email. In development a small switcher at the bottom left lets you sign in as a seeded sample guest, berth holder or staff member (real users that `supabase/seed.sql` creates, with the password in `data/supabase/devPersonas.ts`). A production build hides it and the `/dev` pages unless `NEXT_PUBLIC_ENABLE_DEV_TOOLS=1` is set at build time. Do not set that flag on a project with real people in it: the sample accounts have a public password. With no Supabase project configured, or `NEXT_PUBLIC_ACCOUNT_DATA=mock`, the switcher signs in mock accounts that live in the browser instead.

## Scripts

| Script                  | What it does                                                           |
| ----------------------- | ---------------------------------------------------------------------- |
| `npm run check`         | The gate: types, lint, copy and i18n checks, formatting, tests, build  |
| `npm run typecheck`     | `tsc --noEmit`                                                         |
| `npm run lint`          | ESLint                                                                 |
| `npm run format`        | Prettier (write)                                                       |
| `npm run check:copy`    | Fails on em dashes, filler words and exclamation marks                 |
| `npm run check:i18n`    | Fails when the four languages are out of step                          |
| `npm run test`          | Unit and component tests                                               |
| `npm run test:e2e`      | Playwright journeys and axe on every route (builds and serves on 3100) |
| `npm run knip`          | Finds unused files, exports and dependencies                           |
| `npm run db:seed:build` | Writes `supabase/seed.sql` from the app's berths and sample data       |

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

Everything the UI reads or writes goes through `lib/data/index.ts`. Nothing outside `data/` and `lib/data` should know where the data comes from.

- **Guest and berth holder screens** (`lib/data/account.ts`, `lib/data/holder.ts`, `data/supabase/accounts.ts`) read and write Supabase: the profile, the user's own boats, arrival requests (`request_arrival`), `My arrivals`, and relet offers (`submit_relet_offer`, `cancel_relet_offer`, `request_early_return`). The browser mock in `data/mock/*` stays for the end-to-end tests and for running with no project (`NEXT_PUBLIC_ACCOUNT_DATA=mock`). It reads and writes `localStorage` (always inside try and catch) and fires an `aldock-mock-changed` event so screens stay in step.
- **The staff back office** uses `lib/data/staff.ts`, where every function returns a Promise and screens read through `useStaffData`. Each call loads the staff member's marina data from Supabase, runs the same rule as the mock (`data/mock/snapshot.ts` points the mock stores at the loaded rows for the length of one call), and saves only the rows that changed (`data/supabase/staff.ts`). The rules are written once, so the mock and Supabase cannot disagree. `NEXT_PUBLIC_STAFF_DATA=mock` switches the back office back to the mock; the end-to-end tests do this.
- **Reception, the berth planner, customers, dock tasks and the radio log** read and write Supabase directly (`data/supabase/backoffice.ts`) and have no mock. On the mock they show a short note instead. Their rules (the document checklist, berth fit, the planner grid, expiry, task and log checks) are in `features/staff/lib` with unit tests.

On Supabase, a guest's request and a berth holder's offer reach the staff database at once, and staff decisions reach their screens (My arrivals, My berth).

## Supabase

The schema is in `supabase/migrations` and the sample data in `supabase/seed.sql` (generated, do not edit by hand). Every table has row level security: a signed-in user reads and writes only the marinas they are in `staff_members` for, an admin of a marina manages its staff, and the anon role has no access at all. The browser only ever holds the publishable key.

### Accounts and roles

Sign-ups are on, because guests create their own account with the email link at `/login`. A role is never chosen by the person:

- **Guest**: anyone who signs in. They read and write only their own profile, boats and arrival requests (`profiles`, `boats` with a `user_id`, and the `my_arrivals` view). They never see which berth is free or who is in which berth.
- **Berth holder**: a guest the marina has linked to a berth. Staff enter the holder's email on the berth's page in the back office (`/staff/berths/G-14`, which calls `link_berth_holder`). If the person has not signed in yet the holding waits for the email and attaches when they first do. The holding is a row in `berth_contracts` with a start and end date, and only staff can create or end it. The Guest and Berth holder switch shows only while a holding covers today.
- **Staff**: a row in `staff_members`. The staff sign-in form never creates an account, so a person who signs up as a guest cannot become staff. To add someone, invite their email in Supabase (Authentication, Users, Invite user), then add a `staff_members` row for their user id and marina.

Every table has row level security. Signed-out visitors can read the `marinas` table and nothing else (no berths, no occupancy).

### The arrival flow

1. A guest sends a request from the marina page. `request_arrival` creates an `arrivals` row with status `new` (shown as Requested), linked to the guest and the boat they chose.
2. Staff see it at once on the arrivals board (Supabase Realtime), with a New badge. `suggest_berths` lists the berths that fit the boat's length, beam and draft and are free every night of the stay, including a berth whose holder has an approved relet offer covering those nights.
3. Staff act: `confirm_arrival` (one click on a suggestion), `decline_arrival` (a reason is required and the guest sees it) or `propose_dates`. The guest sees the result under My arrivals, and can accept proposed dates (`accept_proposed_dates`).
4. The database refuses a double booking: an exclusion constraint on `arrivals` (`arrivals_no_double_booking`) stops two confirmed or arrived stays overlapping on one berth, even if two staff members confirm at the same moment. Staff see "That berth was just taken for those nights."
5. A berth holder's `Offer my berth` calls `submit_relet_offer` (status Pending). Staff approve or decline it in Reletting. Only an approved offer makes the berth available to `suggest_berths`. Cancelling an approved offer is refused (`cancel_relet_offer`) while a guest is confirmed on the berth in that period; the holder is told to contact the marina.
6. `berth_events` records every status change on an arrival, a relet offer and a berth holding (who, what, when), by trigger. Each berth's page in the back office shows it.

Statuses on screen map to the existing columns: Requested is `new`, Confirmed is `approved` with `pending`, Arrived and Departed are the `arrival_status` values, Declined is `declined`, and Other dates offered is the new `dates_proposed`. A relet offer's first status `submitted` is shown as Pending.

### Set up a project

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Then turn on email sign-ups in the dashboard (Authentication, Sign In / Providers, Email: allow new users to sign up), add `http://localhost:3000/auth/callback` and your site's `/auth/callback` address to the redirect URLs, and set up your own email provider (Authentication, SMTP). The built-in sender allows only a few emails an hour, which is not enough for guests.

### Sample data (development projects only)

`supabase/seed.sql` fills Marina de Cascais with sample guests with boats, Jordan Reyes as the holder of G-14, requests in every status, an approved relet offer, dock tasks and radio entries. It creates real users with the dev password (guests, a berth holder, and one account per staff role, a marinheiro team lead and a seasonal marinheiro whose access has ended), so it refuses to run unless the project is marked for development: `alter database postgres set app.allow_dev_seed = 'on';` once, in the SQL editor. Run it with `npx supabase db push --include-seed`, or paste the file into the SQL editor. It is safe to run twice. `npm run db:seed:build` rebuilds it after the sample data changes.

### Tests of the database rules

`tests/unit/sql-arrival-flow.test.ts` and `tests/unit/sql-seed.test.ts` run the real migrations and the seed on an in-process Postgres (pglite), with Supabase's own pieces stubbed. They check row level security, the double booking constraint, suggested berths, the cancel block, the history log and the seed.

## Staff roles and the dock team

Five roles, each with its own start screen after `/staff/login` and a navigation that shows only what it can use: director (Overview, Team and everything else), dockmaster (Day plan, berth planner, relet approvals, berth holders, shifts, staffing, the dock team), reception (arrivals and requests with suggested berths, check-in, customers, radio log, new jobs), marinheiro (My next job, My day, My shifts; a team lead may also assign jobs) and night watch (Tonight with late check-in, radio log, incident reports, jobs).

What a role may do is a list of capabilities in `role_capabilities` (`supabase/migrations/20261030100000_staff_roles.sql`). `has_capability()` checks the role, that the account is active and that `access_until` has not passed, and row level security uses it on every table: a marinheiro or the night watch never reads customer contact details, passports or documents (the night watch's list comes from `tonight_movements`, boat, size and berth only). The team changes only through database functions: a director invites anyone and changes any role, a dockmaster only marinheiros and the night watch, nobody changes their own access, the last active director stays, and every change lands in `staff_audit_log`. A platform admin (`platform_admins`) can create a marina's first director with `platform_create_director` and reads nothing else. Someone invited without an account becomes a member at their first sign-in; if sign-ups are off in Supabase, also invite them under Authentication, Users.

Booked help: a guest asks for help mooring on the arrival request (with a reason, never anything health related), and a berth holder books help leaving and coming back on My berth. Each booking is a job in `dock_tasks`; an arrival's job stays inactive until staff confirm the arrival. A slot is busy when the people booked reach the marinheiros on shift (`shifts`); a boater only ever sees busy or not, with quieter times, and is never refused. `features/staff/lib/jobs.ts` holds the rules the screens use: people needed from length, capacity per half hour, staffing per hour, and the next job (the dockmaster's order first, then the earliest, preferring the nearest pontoon).

The staff area installs as its own app (`public/staff.webmanifest`). Alerts (a job assigned to me, a colleague asking for help, a job starting soon still short of people) show in the app and, where the phone allows notifications, as a notification while the staff app is open or in the background. Notifications to a closed app need a push server (Web Push keys and a sender); that is not built yet.

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

The site is in English, Portuguese (European), Spanish and French, and only those. Every user-facing string, including `aria-label` and `alt` text, comes from `lib/i18n`. English is the source: `lib/i18n/locales/en/<area>.ts` defines the shape, and the other languages must match it key for key. `npm run check:i18n` fails on a missing or extra key, an unused key, or a value left identical to English (shared words go in `scripts/i18n-same-as-english.json`). Dates, times, money and plurals go through `useFormat` and `lib/i18n/format.ts`, never by hand. Emails to the marina are written in English or Portuguese (`lib/i18n/mail.ts`). The staff back office is in English and European Portuguese only, from its own dictionary in `lib/i18n/staff`, with an EN | PT switch in the staff top bar; `npm run check:i18n` checks it too. Messages from the shared rules in `data/mock` and the berth map's own labels are still English. The owner reletting flow and the dev tools are English only for now (see `docs/audit/PROGRESS.md`, Deferred).

## No em dashes

No em dash (U+2014) anywhere: not in the interface, data, comments, commit messages or docs. A spaced en dash counts too. `npm run check:copy` enforces it, along with a short list of marketing filler words and exclamation marks.

## Tests

`npm run test` runs the unit and component tests. Expected values in the tariff, rules and relet tests were written by hand from the published rules, not copied from the code. `npm run test:e2e` builds the app, serves it on port 3100 with the dev tools on, and runs the journeys and the axe checks on a phone (390 by 844) and a desktop.
