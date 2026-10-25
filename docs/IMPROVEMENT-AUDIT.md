# Improvement audit (25. 10. 2026)

Scope: the existing site in this repo (Astro 7 SSR on Cloudflare Workers, D1 `kurzovyradar`, cron import of Tipsport and Chance partner feeds). Everything below was checked in code, against production D1 or on the live site. Earlier verbal audits were treated as hints, not as facts.

## Baseline before changes

| Check | Result |
|---|---|
| `vitest run` | 160 passed, 1 skipped |
| `astro check` | 0 errors, 20 hints |
| build + deploy (`bin/kurzovyradar-deploy.sh`) | ok |
| Production D1, 25. 10. 00:30 | 3 317 compared offer pairs Tipsport × Chance: 3 315 equal, 2 different; 1 848 paired events, 0 pairing mismatches; 96 successful runs per book in 24 h, 0 failed |

Pre-existing issues found unrelated to this work: none blocking. `astro check` hints (unused variables) left as they were.

## Findings

| # | Priority | What was verified | Where | Impact | Status |
|---|---|---|---|---|---|
| 1 | P0 | Differences between books were computed only from offers that **moved in the last 24 h** (`derive.ts` built the radar input from offers with history only). A price unchanged for two days was never compared with the other book's price that moved today. | `src/server/store/derive.ts`, `src/server/radar/compute.ts` | Missing "rozdíl" findings | Fixed: diffs over every current offer (`opts.diffs`). Test `data-quality.test.ts`. |
| 2 | P0 | A provider answering HTTP 200 with an empty or cut-off list was stored: every missing match got `removed_at` and the book looked freshly checked. No such incident in the last 24 h (matches_seen 176 → 1 358 was the all-sports launch), but nothing prevented it. | `src/server/run.ts` | Site empties itself while showing "zkontrolováno před 2 min" | Fixed: `collapsed()` rejects a run with < 40 % of the previous count (≥ 100), recorded as a failure; accepted after 3 rejections in a row (real lasting drop). Tests in `import.test.ts`. |
| 3 | P0 | Books were compared whenever each was under the 45 min stale limit, even 40 min apart (one book failing, the other fresh). The older price could win "nejvyšší". | `src/server/store/derive.ts` (`isCurrent`) | False "highest" and false differences | Fixed: `inSync()` + `MAX_SKEW_MIN` (20). A lagging book is shown as "starší údaj", never compared. Test. |
| 4 | P0 | Radar periods (1 h / 6 h / 24 h) used "the last recorded price before the start" even when the book had an outage across the start; the change could have happened before the period. | `src/server/radar/compute.ts` | A change attributed to the wrong period | Fixed: a period is measured for a book only when a successful run confirmed its prices within 2 × import interval before the start (`coveredAt`). Tests (outage → no claim). |
| 5 | P0 | Freshness per offer: "last confirmed" = book's last successful full fetch (the offer was in it, otherwise it gets `removed_at`); "last change" = `changed_at`; "first captured" and "highest captured" are labelled as captured by us, not opening/absolute. Time stored as unix UTC, shown in Europe/Prague; DST covered by `days.test.ts`. | `import.ts`, `format.ts`, `days.ts` | – | Verified, no change needed. Provider timestamp per offer: the feed has none (documented in DATA-QUALITY). |
| 6 | P0 | Pairing: sport, competition, market (1X2 regular time vs. two-way winner), both participants in order (swap = different bet), kick-off; ambiguous candidates are not merged. Identical Tipsport/Chance prices are the same platform (same ids and paths), not a duplicated import: 2 of 3 317 pairs differ, which a duplicated import could not produce. | `normalize/pair.ts`, `markets.ts`, D1 | – | Verified. |
| 7 | P0 | Homepage put the bonus block before the tool's own content; the "Jak funguje" step still said "na fotbal a hokej" though all sports are compared. | `src/pages/index.astro` | Misleading claim; commercial block before the main use | Fixed: new H1 "Kurzy přehledně. Změny pod kontrolou.", lead and CTA "Prohlédnout dnešní zápasy" + "Otevřít radar", bonus block moved below the tool, sports claim from config. |
| 8 | P0 | Coverage claims typed by hand on several pages (books, "každých 15 minut"). | pages, `config/coverage.ts` | Contradictions when config changes | Fixed for pages: `FEED_NAMES`, `FEED_GENITIVE`, `cfg.importIntervalMin`. Test forbids "každých 15 minut" in pages/components. Guides (Markdown) still name the books; a test fails if `FEED_BOOKS` changes. |
| 9 | P0 | Radar cards already answer match, exact bet, change, period, book, check time and why the card is there (`findings.ts`). Missing: implied probability in percentage points. Long shots (odds > 10) flooded the list. | `src/lib/findings.ts`, `src/pages/radar/index.astro` | Misreading % of price as % of chance | Fixed: line "odpovídá 45,5 % místo 50,0 % (−4,5 procentního bodu) … ne skutečná šance"; prices > 10 hidden by default with a visible count and a link to show them. Filters sport, competition, day, period, type, price range, followed only already existed; "pouze čerstvá" is implicit (only current offers enter the radar). |
| 10 | P1 | Followed items: the "seen" baseline was advanced right after rendering, even in a background tab, and could be overwritten by `null` when the price was momentarily unavailable. A home/away swap would silently compare the other team. | `src/scripts/sledovane.ts`, `follow.ts` | Lost changes, false comparisons | Fixed: baseline moves only when the tab is visible and only to a known price; swap detected (`swapped`) and shown, never compared. Existing stored items keep working (same storage key and shape). |
| 11 | P1 | Match detail: noindex after kick-off and 410 after 7 days although history is kept 30 days. | `src/pages/zapas/[slug].astro` | Useful archive dropped from the index | Changed: indexable while it has history; 410 only after `HISTORY_DAYS` (cleanup). Rule does not depend on feed state. |
| 12 | P1 | robots.txt disallowed filter parameters whose pages carry `noindex` (Google could never read the noindex). | `src/lib/robots.ts` | Conflicting signals | Fixed: parameters crawlable; cost bounded by the parameter whitelist. Test. |
| 13 | P1 | Notifications: the site only evaluates a target when opened ("Neposíláme e-mail ani upozornění" is stated). No server-side rule storage. | `zapas/[slug].astro`, `sledovane.ts` | – | Not implemented, see ROLLOUT (needs VAPID keys and a D1 table; design ready). Copy is honest today. |
| 14 | P1 | GSC: property verified; 1 impression in 28 days; sitemap last read 23. 10. (22 URLs); an old WordPress `sitemap_index.xml` (404) still registered. | Search Console | Discovery lag | Resubmitted `sitemap.xml` (1 660 URLs), removed the dead sitemap. Indexing cannot be judged yet (site live since 23. 10.). |
| 15 | P2 | Provider adapter is separate from the normalized model (`providers/platform.ts` → `normalize/*` → `store/import.ts`). | – | – | Documented in DATA-QUALITY; no fake third source added. |

## UX úpravy (25. 10. 2026, druhé kolo)

| Nález | Ověření | Úprava |
|---|---|---|
| Homepage výběr nejde omezit na sport/soutěž | potvrzeno (`index.astro`, blok `#vybrano` bez filtru) | Volby Všechny sporty · Fotbal · Hokej (`?vyber=`, noindex + canonical `/`) · Moje soutěže (JS, existující úložiště sledovaných, `/api/sledovane.json`, prázdný stav s „Vybrat soutěž“); „Vybrané soutěže“ podle slugů. Test `picks.test.ts`. |
| Karty radaru jsou dlouhé | potvrzeno (`FindingCard.astro`) | Krátká karta (zápas, soutěž+čas, sázka, hlavní zjištění, kancelář, čas kontroly, „Detail změny“ + „Sledovat“); rozdíl dvou kanceláří vedle sebe bez šipky; základ srovnání, výplata a procentní body v `<details>`. |
| Sledované jen v patičce | částečně opraveno už dřív (hvězdička v hlavičce) | NAV: Dnes · Pohyby kurzů · Sporty · Jak na kurzy · Bonusy + „Více“ (Všechny kurzy, Soutěže, Kde vsadit, Kalkulačky); „Moje sledované“ s textem v hlavičce (od 1100 px, pod tím ikona s popiskem), v mobilním menu první položka; menu se zavírá kliknutím mimo a Escape. |
| Bonus před grafem na detailu | potvrzeno | Pořadí: srovnání + kalkulačka → shrnutí + graf → kde je vyšší kurz → historie → bonus → další zápasy. Test `content.test.ts`. |
| „Stejné kurzy“ při 3,40 vs 3,43 | potvrzeno (detail, prázdný stav homepage) | `src/lib/agreement.ts` (`priceAgreement`, `AGREEMENT_TEXT`, `oddsPair`); práh radaru o shodě nerozhoduje. Test. |
| Univerzální „domácí, remíza, hosté“ | potvrzeno v `/kurzy/` | `marketsRule()` v `lib/market.ts` podle trhů ve výpisu (`/kurzy/`, `/dnes/`, sporty). Test. |
| Tlačítka „Na co“ uřezávala jména | opraveno dříve (`5317c20`) | – |
| Opakovaná hláška o překrytí v grafu | neopakuje se: jedna na viditelný graf, skryté panely nejsou v accessibility tree | beze změny |

Ověřeno v Chromiu (puppeteer) na živém webu: 360/390/768/1024/1280 px bez vodorovného posunu; volby na homepage mění karty; „Moje soutěže“ prázdný stav i po sledování NHL (8 zápasů); karta radaru se rozbalí klávesou Enter, focus je viditelný; tok sledování detail → počet v hlavičce → /oblibene/ → obnovení → odebrání. Neověřeno: čtečka obrazovky (VoiceOver/TalkBack), skutečný dotykový telefon, Safari.
