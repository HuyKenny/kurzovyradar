# Data quality rules

## Sources
- **Tipsport** (`partners.tipsport.cz`) and **Chance** (`partners.chance.cz`): partner API of the same platform, one bulk request per book per run (`src/server/providers/platform.ts`). Separate credentials and hosts. Match ids and match paths are identical across the two books (same platform), prices usually too (2 of 3 317 pairs differed on 25. 10. 2026).
- **No odds feed** for Allwyn, MerkurXtip, Fortuna, Betano or anyone else. A partner link is not a data source (`config/bookmakers.ts`: `oddsFeed` and `affiliate` are independent).

## Pipeline
`providers/platform.ts` (fetch) → `normalize/source.ts` (one head-to-head prematch match with a market we understand, or nothing) → `store/import.ts` (pairing, offers, history) → `store/derive.ts` (page snapshots, radar) → pages.

A new source needs only a fetch function in `run.ts` (`PROVIDERS`) and a mapping to `SourceMatch` (`server/types.ts`): `srcId`, sport, competition slug, participants in the source's order, kick-off (unix s, UTC), `market` (`'1x2'` regular time or `'12'` winner), outcomes `1`/`x`/`2` with decimal odds and an enabled flag, and the source path. Before connecting one: written permission to store and publish its prices, its update limits, and a fixture-based test like `tests/import.test.ts`.

## Pairing (`normalize/pair.ts`)
Two offers are compared only if sport, competition, market, both participants **in the same order**, and kick-off (tolerance `START_TOLERANCE_MIN`, default 0) agree. A shared source id is only a candidate. Several candidates → not merged (new event). Swapped home/away → `mismatch`, kept apart. The 1X2 market is the result after regular time (no overtime, no shoot-out); a two-way "Vítěz zápasu" includes the decision. They are never compared with each other.

## Times
| Field | Meaning |
|---|---|
| `book_state.last_success_at` | Fetch time of the last response that passed validation and was fully stored. It confirms every offer present in it (absent offers get `removed_at`). |
| `offers.changed_at` | Last recorded change of price or availability. Old `changed_at` with a fresh `last_success_at` = price confirmed, simply unchanged. |
| `offers.first_at` / `first_odds` | First price **we** captured, not the bookmaker's opening price. |
| `offers.max_odds` | Highest price **we** captured, not an absolute maximum. |
| provider time | The feed carries no per-offer timestamp; none is invented. |

All times are unix seconds (UTC), shown in Europe/Prague (`lib/format.ts`, DST tested in `days.test.ts`).

## Validation of a run
- Login, HTTP status and body shape are checked (`platform.ts`); a response older than the stored one is skipped.
- **Collapse guard** (`run.ts`): fewer than 40 % of the previous run's matches (previous ≥ 100) is a failure (`collapse: …`), nothing is stored. After three such runs in a row the drop is accepted as real.
- A failed book keeps its last valid data; it ages out by the rules below. The other book is stored independently.

## When a price may be compared (`isCurrent`, `inSync`)
- book checked within `STALE_AFTER_MIN` (45);
- book's last check at most `MAX_SKEW_MIN` (20) older than the newest fresh book's (both run in the same cron; a bigger gap means failed runs);
- offer enabled, not withdrawn, source paired, match not started.
Anything else is shown with its state (`starší údaj`, `pozastaveno`, `už není v nabídce`, `nespárováno`) and never wins "nejvyšší z aktuálně sledovaných kurzů", never creates a difference and never fires a target.

## Radar (`radar/compute.ts`)
- Change % = (new / old − 1) × 100. Implied probability = 1 / odds, its change in **percentage points**, labelled as a price conversion including margin, not a real chance.
- A period (1 h, 6 h, 24 h) is measured for a book only if tracking started before the period **and** a successful run confirmed its prices within 2 × `IMPORT_INTERVAL_MIN` before the start. Otherwise the period is "not enough data", never a zero change.
- Differences use every current offer pair, regardless of when the prices last moved.
- Order: by size of the change; partnership never affects it.

## Known limits
- 15-minute checks: changes between two checks are not seen; a change is dated by the check that found it.
- Outages show as gaps in the detail chart (failed runs are listed); no values are interpolated.
- Two books of one group are not "the market".

## Shoda cen v textech
Jedna funkce `priceAgreement()` (`src/lib/agreement.ts`) pro všechny stránky: porovnává uložené celé tisíciny přesně. `same` jen při stejném čísle; rozdíl pod prahem radaru (`MIN_DIFF_PCT` 1 %) je „Kurzy se mírně liší.“, nikdy „stejný kurz“. Jedna kancelář = „Pro srovnání chybí kurz druhé kanceláře.“ Kdyby dvě různé hodnoty po zaokrouhlení na 2 místa vypadaly stejně, `oddsPair()` je ukáže na 3 místa (platforma kotuje po 0,01, je to pojistka).
