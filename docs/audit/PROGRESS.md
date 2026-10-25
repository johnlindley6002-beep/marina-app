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

None yet.

## Phases

- [x] Phase 0 baseline
- [x] Phase 1 audit
- [x] Phase 2 tooling
- [ ] Phase 3 architecture
- [ ] Phase 4 design system
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

## Deferred

- react-hooks/set-state-in-effect warnings (17): convert the localStorage hydration effects to useSyncExternalStore.
