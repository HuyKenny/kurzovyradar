# Kapacita pilotu a limity Cloudflare

Limity ověřené v oficiální dokumentaci 23. 10. 2026 ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)):

| Limit | Workers Free | Workers Paid (účet Kennyho) |
|---|---|---|
| CPU na Cron Trigger | **10 ms** | 30 s (interval < 1 h) |
| CPU na HTTP požadavek | 10 ms | 30 s výchozí |
| Paměť isolate | 128 MB | 128 MB |
| D1 dotazy na invokaci | **50** | 1 000 |
| D1 parametry na dotaz | 100 | 100 |
| D1 čtení | 5 mil. řádků/den | 25 mld./měs v ceně |
| D1 zápisy | 100 tis. řádků/den | 50 mil./měs v ceně |
| D1 velikost DB | 500 MB | 10 GB |
| Velikost řádku/hodnoty | 2 MB | 2 MB |

**Účet už je na Workers Paid** (5 $ paušál platí kvůli ostatním projektům). Nic nového se nezapínalo. Pilot je navržený tak, aby se **objemem dat vešel do bezplatných kvót D1**. Na čistém Free plánu by ale **neprošel**:
- **CPU:** import parsuje 2× ~2,7 MB JSON. Normalizace v Node trvala ~4–10 ms na kancelář, celý běh v lokálním workerd 66–133 ms na kancelář (včetně D1). 10 ms na cron je pro takový feed málo. Menší počet návštěvníků to neřeší, rozhoduje velikost feedu.
- **Dotazy:** první běh na prázdné DB = 204 a 181 dotazů (Free povoluje 50). Ustálený běh = ~30 dotazů na kancelář.

## Naměřeno (lokálně, workerd + lokální D1, reálná data 23. 10. 2026)

| Běh | Kancelář | Zápasy | Změněné kurzy | Dotazy | Řádky čtené | Řádky zapsané |
|---|---|---|---|---|---|---|
| 1. (prázdná DB) | Tipsport | 211 | 631 | 204 | 1 925 | 3 002 |
| 1. (prázdná DB) | Chance | 211 | 631 | 181 | 2 973 | 2 317 |
| 2. (o ~40 min později) | Tipsport | 208 | 100 | 30 | 3 074 | 301 |
| 2. | Chance | 208 | 100 | 30 | 3 074 | 301 |
| snapshoty (`derive`) | – | 211 | – | 7 | 8 179 | 2 |

Počty řádků jsou z `meta` D1 (zahrnují zápisy do indexů). Z čistého testu nad node:sqlite: 226 zápasů, 1 352 nabídek, upcoming snapshot 256 kB (limit řádku 2 MB).

## Odhad pro provoz (96 běhů denně)

- **Zápisy:** horní odhad = každý běh jako 2. běh výše (změny za 40 min, ne za 15) → 96 × (2 × 301 + 2) ≈ **58 tis./den** (< 100 tis. Free). Reálně méně, protože za 15 min se změní méně kurzů.
- **Čtení importem:** 96 × (2 × 3 074 + 8 179) ≈ **1,4 mil./den**.
- **Čtení stránkami:** homepage, srovnávač, radar, sport a soutěž čtou 1 řádek (`derived`) + nic dalšího. Detail zápasu: 1 + zdroje (2) + nabídky (6) + historie (desítky) + chyby importu (index) ≈ 20–100 řádků. HTML je v edge cache 5 min (a 30 min stale s obnovou na pozadí). I 10 000 nekešovaných renderů detailu denně ≈ 1 mil. čtení. **Celkem pod 5 mil./den.**
- **Velikost DB:** ~230 nadcházejících zápasů, ~1 400 aktuálních nabídek; historie ≈ jednotky tisíc řádků denně, 30 dní ≈ 100–200 tis. řádků → jednotky až nízké desítky MB.
- **Úklid:** běh ve 03:xx UTC maže historii, nabídky, zdroje a zápasy starší než `HISTORY_DAYS` (30) a záznamy běhů starší 14 dní.
- **Indexy:** `events(start_at)`, `events(competition_id, start_at)`, `offers(changed_at)` pro radar, `event_sources(event_id)`, `import_runs(book, started_at)` pro vyznačení výpadků. Detail čte historii přes prefix primárního klíče.
- **Volání partner API:** 2 požadavky na kancelář a běh (OAuth token + hromadný `matches`), tedy 4 na běh a 384 denně. Stejný vzor jako sportstreamy (`refreshUpcoming`).

## Měření v produkci

Po několika bězích ověřit přes GraphQL `d1AnalyticsAdaptiveGroups` (vzor `apps/pixuvo/scripts/verify-free-tier.ts`) a v Workers Observability (`cpuTime` cron invokací). Výsledky doplnit sem.
