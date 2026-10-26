# Architecture

## What the app does

- **Discovery** (`features/discovery`): the home page, the marina list and the country page, with search and filters.
- **Marina page** (`features/marina`): plan a stay, see the berth map, get an estimate, send an enquiry by email, and open the pre-arrival check-in. Cascais is the first marina.
- **Pre-arrival check-in** (`features/prearrival`): a six-step wizard (boat, voyage, crew, documents, stay, review) that ends in a submitted check-in and three generated documents.
- **My boat** (`features/my-boat`): saved boats, documents and skipper details, kept on the device.
- **Owner** (`features/owner`): the holder of a berth offers it for reletting while away, and follows the request.
- **Staff** (`features/staff`): arrivals, check-in and check-out, enquiries, berth operations, records and relet approvals.
- **Account** (`features/account`) and **dev tools** (`features/dev`, hidden in production).

## Data flow

```
schema (Zod)  ->  forms (wizard steps)  ->  mock repository  ->  generated documents
```

1. **Schema.** `features/prearrival/lib/schema.ts` is the single source of truth for a pre-arrival draft. Types are inferred from it, so a field exists in one place.
2. **Forms.** Each wizard step edits a slice of the draft. Hard errors come from the schema and from `warnings.ts` (`getExtraErrors`), and soft guidance from `getWarnings`, which never blocks. `documentRules.ts` decides which documents are asked for, and `readiness.ts` scores a draft by reusing those same rules.
3. **Repository.** `lib/data/index.ts` is the only door to the data. The mock bodies live in `data/mock/*` and use `localStorage`. A draft is saved as the boater goes, and a submit creates a check-in that staff can see.
4. **Documents.** From a submitted check-in the app builds the arrival declaration (PDF), the crew list in the IMO FAL Form 5 layout (PDF), and a draft authority report (JSON and CSV) for movements to or from outside the EU. The PDF library loads only when a button is pressed.

Pricing has one rule set, in `data/marinas.ts`: the class is the larger of the length class and the beam class, nights are priced by season, a multihull pays double, and VAT is added once at the end, in whole cents (`lib/money.ts`). The marina page estimate and the pre-arrival quote both use it.

Dates are `YYYY-MM-DD` strings and all day maths is done on whole UTC days (`lib/dates.ts`), so a clock change cannot shift a night. "Today" is the Lisbon calendar day.

Server and client: pages in `app/` are server components that render a feature component. Anything that reads `localStorage`, the language or the session is a client component. The map, the enquiry form, the lightbox, the dictionaries other than English and the PDF library are loaded on demand.

## Rules the code encodes, and where they come from

| Rule                                                                                                                                                                                                                                                                     | Where in the code                                                                          | Source                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Berth class is the larger of the length class and the beam class. Class limits I to IX and the day rates, low and high season. High season is April to September. Multihull pays 100% more.                                                                              | `data/marinas.ts` (`classifyBoat`, `calculateQuote`), `features/prearrival/lib/pricing.ts` | Cascais marina tariff 2026 (prices exclude VAT)                                                     |
| VAT 23%, added on the total                                                                                                                                                                                                                                              | `lib/money.ts` (`vatOnCents`), `data/marinas.ts` (`vatRate`)                               | Portuguese VAT, as the tariff states it                                                             |
| Third-party insurance is required for a Portuguese boat in navigation zones 1 to 4, and in zone 5 when motorised or a sailboat over 7 m. It is not required for a zone 5 sailboat of 7 m or less with no engine. A foreign boat is asked for it regardless.              | `features/prearrival/lib/documentRules.ts`                                                 | DL 93/2018, art. 33 (the foreign boat case is the marina's own requirement)                         |
| Reletting a berth: the berth is a right of use, so the marina must consent. The marina-mediated relet is art. 23(4). A paid let the holder arranges alone is art. 23(1) and (2) and needs written authorisation. The holder arranging use outside the marina is refused. | `data/marinas.ts` (`RelettingTerms`), `data/mock/reletting.ts`                             | Cascais marina regulation 2001, arts. 23 and 29 (29(1)(i) and 13(1)(m) for the outside arrangement) |
| Passport rules for non-EU nationals: validity of 3 months beyond departure, issued within the last 10 years, at most 90 days in any 180                                                                                                                                  | `features/prearrival/lib/warnings.ts`                                                      | Schengen Borders Code, as applied at the border                                                     |
| EU, Schengen and free-movement classification of countries                                                                                                                                                                                                               | `lib/countries/index.ts`                                                                   | Current EU and Schengen membership. Gibraltar is outside both.                                      |
| A non-EU flagged boat may stay under Temporary Admission for up to 18 months without import VAT, for private use only, when the owner lives outside the EU                                                                                                               | `features/prearrival/lib/warnings.ts`, the voyage step text                                | EU customs rules on Temporary Admission                                                             |
| A movement to or from a non-EU country is reported to the maritime, border and customs authorities                                                                                                                                                                       | `features/prearrival/lib/documents/authorityReport.ts`                                     | Latitude 32 reporting (field list not yet confirmed)                                                |
| A person under 18 needs a guardian chosen from the adults on board                                                                                                                                                                                                       | `features/prearrival/lib/schema.ts` (`isMinor`), `warnings.ts`                             | Marina practice                                                                                     |
| Exactly one skipper per check-in, departure after arrival, an ID or insurance that expires before departure is an error                                                                                                                                                  | `schema.ts`, `warnings.ts`                                                                 | The marina's check-in requirements                                                                  |

About the source column: the project brief also names DL 93/2018 arts. 22, 52 and 54. The code and its comments record only art. 33, so those three are not claimed here. Check what each one covers against the text before this table is treated as complete. The Schengen and Temporary Admission lines state the rule as the app applies it. They are not legal advice, and counsel should review them before launch.

## Open questions to confirm with the marina

1. **The Latitude 32 field list.** The authority report is a draft format. The exact fields and the file format the marina must send are not confirmed.
2. **Notice periods for a marina-led relet.** The regulation mentions 45 days (a borrowed boat) and 30 days (a different owner) in arts. 10(2) and 24(3). It is unclear whether they apply when the marina itself relets under art. 23(4). The setting `noticeRuleEnabled` is off until this is answered.
3. **The 150, 300 and 500 EUR mooring-let fee.** The Cascais 2026 tariff lists a processing fee of 150 EUR (up to 90 days), 300 EUR (up to 180) and 500 EUR (up to 359) for a holder-arranged paid let. The app shows it for information only. It is not confirmed what exactly the fee covers or who pays it.
4. **Reletting numbers.** The credit share (50%), the processing fee (10%) and credit rather than cash are placeholders to set with the marina and review with counsel. The terms page is a placeholder with no legal text.
5. **The return buffer.** Two days before the holder returns are kept clear. Confirm the number.
6. **Busy months.** July and August are marked busy. Confirm with the marina.
7. **Protection rating and photos.** The Moderate shelter rating is a general judgement, and the marina photos are placeholders.
8. **Real contact details.** The company email and phone on the home page are placeholders.
9. **Marina prose in four languages.** Marina descriptions are held in English and Portuguese only. Spanish and French readers see English for the marina's own text.

## Recommendations (not done)

- Replace `script-src 'unsafe-inline'` in the content security policy with nonces when there is a server.
- Consider `zod/mini` for the pre-arrival schema to cut about 90 KB of gzip JavaScript. It changes the schema API.
- Translate the owner reletting flow once its wording has had legal review.
- Add a country-name to ISO-code table so country names can be shown in the visitor's language.
- Change `role="img"` to `role="group"` on the berth map svg, so focusable berths are not inside an image (axe: nested-interactive).
