# KurzovýRadar.cz

Srovnání kurzů sledovaných sázkových kanceláří a vlastní historie jejich změn: fotbal a hokej, bez registrace.
Design „Sportovní tiket“ (od 23. 10. 2026): zápasy jako sázkové tikety, srozumitelné texty (tykání), viz `docs/ASSETS.md`.
Živě na **https://kurzovyradar.cz** od 23. 10. 2026.

- **Stack:** Astro 7 SSR na Cloudflare Workers (`@astrojs/cloudflare` 14), TypeScript, Tailwind 4, D1. Vlastní entry `src/worker.ts`: `fetch` → Astro + edge cache (stale-while-revalidate nad Cache API), `scheduled` → import kurzů.
- **Data:** cron `4,19,34,49 * * * *` (à 15 min, posunutý proti sportstreamy). Každý běh na kancelář: OAuth token + jeden hromadný dotaz `GET /rest/external/offer/v1/matches` (okno −3 h … +7 dní, ~2,7 MB). Návštěva webu nikdy nespouští načítání feedu.
- **Repo:** lokální git v `apps/kurzovyradar/` (Tailwind 4 potřebuje vlastní `.git`, jinak prohledává celý workspace).

## Skutečně připojené zdroje

| Kancelář | Kurzy | Partnerský odkaz | Recenze |
|---|---|---|---|
| Tipsport | **ano** – partner API `partners.tipsport.cz` (OAuth client_credentials) | ano (`TIPSPORT_URL`) | ano |
| Chance | **ano** – partner API `partners.chance.cz` (stejná platforma a stejná ID zápasů jako Tipsport) | ano (`CHANCE_URL`) | ano |
| Allwyn | ne – kurzový XML feed zatím nemáme | ano (`ALLWYN_URL`, record.sazka.cz) | ano |
| MerkurXtip | ne | ano (`MERKURXTIP_URL`, affilmaster, `data1=kurzovyradar`) | ano |
| Fortuna | ne | ne | ne |
| Betano | ne | ne | ne |

Stavy jsou v `src/config/bookmakers.ts` – tři nezávislá pole (`oddsFeed`, `affiliate`, `review`).

**Zjištění z dat (23. 10. 2026):** Tipsport a Chance mají shodná ID zápasů a ve 2 048 z 2 050 zápasů i úplně stejné kurzy hlavního trhu. Srovnávač proto poctivě ukazuje hlavně „Shoda“. Hodnota webu je v historii a radaru pohybů. Další kancelář s vlastním kurzovým feedem (Allwyn) srovnání výrazně zlepší.

## Rozsah pilotu

- **Trh:** jen hlavní trh platformy `WINNER_3W` „Výsledek zápasu“ = **1X2 v základní hrací době** (fotbal 90 min, hokej 60 min). Cokoli jiného (`WINNER_2W`, speciály, dlouhodobé sázky) se nesrovnává (`src/server/normalize/markets.ts`).
- **Proč ne další trhy:** `allEvents=true` v hromadném dotazu vrátil 3,3 MB za 80 zápasů (~40 kB/zápas), tj. ~40 MB na kancelář pro 7 dní. To je mimo paměť i rozumné CPU Workeru. Per-zápas dotazy by násobily počet volání API.
- **Soutěže:** 26 vybraných fotbalových a hokejových soutěží + 5 ženských lig (`src/config/competitions.ts`), ~210–250 zápasů na 7 dní.
- **Muži × ženy:** feed má pro mužskou i ženskou ligu stejný `nameCompetition` (např. „1. španělská liga“). Pohlaví se proto bere z `idSport` (fotbal muži `-1`, ženy `295`, hokej muži `-2`; jiné se přeskočí). Zdrojová `idSport`/`idCompetition` se ukládají do `event_sources` (migrace `0002`).

## Pro začátečníky (od 23. 10. 2026)

- **„Dnes stojí za pozornost“** (homepage, `src/lib/picks.ts`, testy): max. 6 sázek, nejvýš 1 na zápas, jen dnes/zítra. Čtyři důvody, každý je zjištění z dat, ne předpověď: jedna kancelář změnila kurz a druhá má při pozdější kontrole starý (`one-moved`), rozdíl ≥ 1 % (`higher-elsewhere`), zapsaná změna ≥ 8 % (`big-move`), nové maximum ≥ 2 % nad zápisem před oknem (`new-high`). Pořadí: typ důvodu → velikost → dřívější začátek. Affiliate do výběru nevstupuje. Místo pro budoucí ověřený model = nový typ důvodu.
- **Karta sázky** `BetCard.astro`, věty o výsledku a vyhodnocení `src/lib/market.ts` (hokej X = „Remíza po 60 minutách“), výplata vždy podmíněně a odděleně od čistého zisku.
- **Odkazy nesou výsledek:** `?trh=1x2&vysledek=1|x|2&zpet=…#sazka` (`src/lib/links.ts`, `zpet` přes whitelist) → detail předvolí stejný výsledek v grafu, kalkulačce i blocích „Co musí nastat / Proč ji radar vybral / Kde je vyšší kurz“.
- **Sledování bez účtu** (`src/scripts/follow.ts`, localStorage `kr-sledovane` v2): sporty, soutěže, zápasy, sázky. `/oblibene/` ukáže, co se změnilo od posledního zobrazení nebo uložení (`/api/events.json`, `/api/sledovane.json`).

## Architektura (`src/server/`)

```
providers/platform.ts   OAuth + hromadný dotaz (Tipsport i Chance)
normalize/              source.ts (platforma → SourceMatch), markets.ts, participants.ts, pair.ts (párování)
store/import.ts         diff proti D1, zápis jen změn, upsert s ochranou src_ts, removed_at místo mazání
store/derive.ts         snapshoty pro stránky (tabulka `derived`), úklid historie
radar/compute.ts        pohyby 1/6/24 h, rozdíly mezi kancelářemi, maxima (čistá funkce)
calc/odds.ts            změna %, implikovaná p., overround, nejvyšší kurz
demo.ts                 syntetická demo data (jen lokálně)
run.ts                  jeden běh importu (obě kanceláře nezávisle)
```

- **Párování:** stejné platformní ID je jen kandidát. Musí sedět sport, soutěž, oba účastníci ve stejném pořadí, začátek (tolerance `START_TOLERANCE_MIN`, výchozí 0) a trh. Rozejde-li se později, kancelář dostane `mismatch=1` a ze srovnání vypadne, dokud se údaje znovu neshodují.
- **Historie:** řádek v `odds_history` jen při změně ceny nebo `enabled`. Klíč `(event, book, market, outcome, at)` → opakovaný import nevytvoří duplicity.
- **Pořadí:** odpověď starší než poslední uložená (`book_state.last_success_at`) se zahodí celá; upsert nabídky má `WHERE excluded.src_ts >= offers.src_ts`.
- **Výpadky:** chyba kanceláře = záznam v `import_runs`/`book_state`, data zůstávají. Po `STALE_AFTER_MIN` (45 min) přestanou být „aktuální“ a nevyhrávají srovnání; web je ukazuje šedě s časem.
- **Časy:** v DB unix sekundy UTC, zobrazení Europe/Prague (`src/lib/format.ts`).

## Konfigurace (wrangler vars)

| Proměnná | Výchozí | Význam |
|---|---|---|
| `IMPORT_INTERVAL_MIN` | 15 | interval importu (musí odpovídat cronu; text na webu se bere odsud) |
| `CACHE_TTL_S` | 300 | `s-maxage` stránek; worker drží stale kopii 6× déle a obnovuje na pozadí |
| `STALE_AFTER_MIN` | 45 | po této době bez úspěšné kontroly kurz nesoutěží o „nejvyšší“ |
| `HISTORY_DAYS` | 30 | podrobná historie po začátku zápasu, pak úklid (běh ve 03:xx UTC) |
| `START_TOLERANCE_MIN` | 0 | tolerance začátku při párování |
| `WINDOW_DAYS` | 7 | okno importu |

Secrets: `TIPSPORT_CLIENT_ID`, `TIPSPORT_CLIENT_SECRET`, `CHANCE_API_USER`, `CHANCE_API_PASS` (hodnoty v `~/ai/credentials/.kurzovyradar-credentials.env`; vzor `.dev.vars.example` / `.env.example` jen s názvy).

## Spuštění

```bash
pnpm install
pnpm test                    # vitest: výpočty, párování, import, radar (D1 nad node:sqlite s reálnou migrací)
pnpm build
pnpm db:migrate:local
cp .dev.vars.example .dev.vars   # doplnit hodnoty
pnpm preview                 # http://localhost:8831 (reálná data)
curl 'http://localhost:8831/cdn-cgi/handler/scheduled?cron=4,19,34,49+*+*+*+*'   # ruční import
pnpm demo                    # http://localhost:8832 – DEMO: vlastní DB, smyšlená data, banner, noindex
curl 'http://localhost:8832/cdn-cgi/handler/scheduled?cron=*+*+*+*+*'           # naplní demo
PROBE_DIR=… pnpm exec vitest run tests/probe.test.ts   # suchý běh nad uloženou reálnou odpovědí
```

**Demo** má vlastní `wrangler.demo.jsonc` (bez rout a cronu), výstup `dist-demo/` a databázi `kurzovyradar-demo`. Kód ho pustí jen při `DEMO=on` a `ENVIRONMENT != production`; produkce nemá cestu, jak se na demo přepnout.

## Nasazení

```bash
~/ai/bin/kurzovyradar-deploy.sh            # testy → build → D1 migrace → deploy → ověří build na webu
~/ai/bin/kurzovyradar-deploy.sh --secrets  # + nahraje secrets z credentials
```

⚠️ **Vždy `-c dist/server/wrangler.json`.** Astro po každém buildu přesměruje `.wrangler/deploy/config.json` na poslední build. Po `pnpm demo` by holý `wrangler deploy` nasadil demo. Skript to hlídá (kontroluje `ENVIRONMENT=production`).

Zóna: SSL strict, `browser_cache_ttl` 0, WAF (blok CN, skenerů a bezcenných crawlerů) a rate limit `/api/` + `/hledat/` zkopírované ze sportstreamy. Email Routing `info@` → h@huy.cz, DMARC `p=none`, GSC ověřeno DNS TXT (`scripts/kurzovyradar/gsc-setup.py`), IndexNow z Maliny (`bin/indexnow.py kurzovyradar`, cron :55).

## Zbývající podklady (pro Kennyho)

1. **Kurzový feed Allwyn** (XML) – adaptér nemáme. Až bude, přidat provider vedle `providers/platform.ts` a do `FEED_BOOKS`. Bez shodných ID je nutné párování podle faktů (už implementované v `pair.ts`).
2. ~~Vlastní sid~~ **hotovo 23. 10.:** Tipsport sid 45940, Chance sid 45960 (odkazy od Kennyho, `wrangler.jsonc`).
3. **Ověřit v panelu, že deeplink se zápasem** (`www.tipsport.cz/kurzy/zapas/…?pid&sid&bid&tid`) připisuje provizi. Stejná metoda jako sportstreamy, ani tam zatím neověřeno.
4. **Allwyn odkaz:** od 23. 10. vlastní odkaz od Kennyho (record.sazka.cz `_8u72YyI1anJ_qr…`).
5. **Souhlas Tipsportu** s dalším webem nad jejich API. Kenny zvolil vlastní volání (2× token + 2× hromadný dotaz za 15 min).
6. **Fortuna, Betano:** API ani partnerství nejsou.
7. **Brand kity log:** loga Tipsport/Chance jsou ze souborů portfolia (oficiální dlaždice), Allwyn z jejich webu. Viz `docs/ASSETS.md`.
8. **GA4:** nenasazeno (bez měření, bez cookie lišty). Pokud bude chtít, doplnit `SITE.ga4` a převzít cookie lištu z freespiny.

Podrobnosti: `docs/ASSETS.md` (vizuály a jejich původ), `docs/CAPACITY.md` (měření a odhad kapacity).

## Obsah z content gapu (24. 10. 2026)

- **Přehledy kanceláří** (`review: 'info'` v `src/config/bookmakers.ts`, data v `reviews.ts`): jen fakta se zdrojem a datem, sekce „Co jsme neověřili“, bez partnerského odkazu, hodnocení a čísel bonusů (hlídá `tests/content.test.ts`).
- **Srovnání** `/sazkove-kancelare/srovnani/`, **rejstřík pojmů** `/pojem/` (`src/config/glossary.ts`), **Zápasy dnes** `/dnes/`, kalkulačky (`src/lib/calc-text.ts` + `src/server/calc/odds.ts`), průvodci v `src/content/pruvodce/`.
- Záměrně chybí: tipy a predikce, kontrola tiketu, daň z výher (nemáme ověřený oficiální zdroj), forma/H2H/tabulka (nemáme zdroj dat).

## Jedna vybraná sázka, radar a sledování (24. 10. 2026)

- **Stav sázky v URL** (`src/lib/bet-state.ts`, `src/scripts/bet.ts`): `?trh=1x2&vysledek=1|x|2&vklad=…&obdobi=1h|6h|24h|3d|vse&zjisteni=rust|pokles|rozdil|max&zpet=…`; staré `?tip` funguje jako alias. Server vykreslí části všech tří výsledků, nevybrané jsou `hidden`; skript je přepíná, drží vklad a píše URL (pushState / replaceState).
- **Kontext radaru** (`src/lib/context.ts`, `src/lib/findings.ts`): období se z radaru přenáší do detailu a měří se k času snapshotu (`rd.at`), pozdější změny jsou zvlášť. Karty radaru: `FindingCard.astro`, texty a dopad na výplatu v `findings.ts`.
- **Filtry radaru** v URL: `pohled, obdobi, den, sport, soutez, od, do, zmena`; „jen moje sledované soutěže“ (`sledovane=1`) filtruje prohlížeč (`src/scripts/radar.ts`). Dny `dnes/zitra/vikend/7` v pražském kalendáři (`src/lib/days.ts`, bez 86 400 s aritmetiky). Počty: `src/lib/counts.ts`.
- **Cílový kurz** (`src/lib/target.ts`, `/api/cile.json`): uložen v `kr-sledovane` jako `target` (tisíciny) a `targetAt`; starší uložení se načtou beze změny (`parseState` v `follow.ts`).
- **Ukázka pro začátečníky**: `BeginnerExample.astro` + `src/scripts/priklad.ts` + `/api/priklad.json` (skutečný zápas, jinak označený výukový příklad).
- Testy: `bet-state`, `findings`, `days`, `counts`, `target`, `follow`, `import` (čas zachycení změny se nepřepisuje).

## Všechny sporty a dva typy trhu (24. 10. 2026)

- **Sporty:** 21 sportů z feedu Tipsport/Chance (`SPORTS` v `src/config/competitions.ts`; fotbal, hokej, basketbal, tenis, volejbal, americký fotbal, stolní tenis, házená, esporty, bojové sporty, box, florbal, rugby, šipky, futsal, badminton, baseball, vodní pólo, kriket, snooker, squash). Stránky `/sporty/` a `/<sport>/` (`src/pages/[sport]/index.astro`, fotbal a hokej mají vlastní soubory). Nesledujeme sázky na vítěze z mnoha účastníků (dostihy, motorsport, lyžování, společenské sázky) ani dlouhodobé sázky.
- **Trhy:** `1x2` = „Výsledek zápasu“ (tři možnosti, remíza možná) a `12` = „Vítěz zápasu“ (dvě možnosti, bez remízy; i „Vítěz zápasu do rozhodnutí“). Trh je vlastnost události (`events.market`); různé trhy se nepárují. Věty o vyhodnocení jsou v `src/lib/market.ts` a u neznámých sportů neuvádějí nic, co neověříme (pravidla určuje kancelář).
- **Soutěže:** vybrané fotbalové a hokejové ligy jsou ručně popsané; ostatní se zakládají podle názvu u kanceláře (`src/server/normalize/competition.ts`: slug `sport-název[-varianta]`, varianta = ženy, čtyřhra, junioři…; esporty: hra + turnaj). Seznamy sportů a soutěží na webu se berou z aktuální nabídky (`src/lib/catalog.ts`).
- **Kapacita:** `derived.upcoming` smí mít < 2 MB (D1) → snapshot bez polí jen pro detail a s ořezem nejvzdálenějších zápasů (`snapshotJson`). První import se rozloží do více běhů (`MAX_NEW_EVENTS`, výchozí 250 nových událostí na kancelář a běh; limit D1 je 1 000 dotazů na invokaci).
- **Migrace 0003** přestavuje `competitions` a `events` (bez CHECK na sport, nový sloupec `market`); otestováno na node:sqlite i na lokálním D1 s daty a zapnutými cizími klíči.
