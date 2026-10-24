# SEO map (25. 10. 2026)

State: site live since 23. 10. 2026. Search Console (URL-prefix property): 1 impression in 28 days, sitemap read once (22 URLs, 23. 10.). On 25. 10. the sitemap (1 660 URLs) was resubmitted and the dead WordPress `sitemap_index.xml` removed. Indexing cannot be judged yet; no search volumes are claimed here. Next check: GSC "Pages" report and `searchAnalytics` by page after 14 days.

Rules for all pages: canonical = path without query (`layouts/Base.astro`); any query → `noindex, follow` except where noted; unknown query parameters are stripped by the Worker before render and cache (`lib/params.ts`); trailing slash and lowercase are enforced with 301; `www` → apex 301 (Redirect Rule + Worker); the sitemap lists only canonical, indexable URLs that answer 200, `lastmod` only where content really changed (guides).

| URL | Purpose | Search intent | Index | In sitemap | Main internal links | Planned |
|---|---|---|---|---|---|---|
| `/` | Entry: what the tool does, today's picks, search, status of data | brand, "porovnání kurzů" | index | yes | nav, footer | – |
| `/kurzy/` | All matches with both books side by side, filters | "kurzy dnes", "kurzy Tipsport Chance" | index; `?…` noindex | yes | nav, home | – |
| `/dnes/` | Today's matches | "zápasy dnes kurzy" | index; `?strana` noindex | yes | home CTA | – |
| `/radar/` | Recorded price movements and differences | "pohyb kurzů" | index; filters noindex | yes | nav, home | – |
| `/sporty/`, `/{sport}/` (`/fotbal/`, `/hokej/`, `/tenis/` …) | Sport hub with its matches | "kurzy na tenis" … | index while it has matches; noindex when empty; `?strana` noindex | sports with matches | nav, home, footer | longer sport texts (tenis, basketbal, esporty, MMA, šipky) |
| `/souteze/`, `/souteze/{slug}/` | Competition hub and pages | "kurzy Premier League" … | index while it has matches; **noindex when empty** (thin) | competitions with matches | sport pages, footer, matches | editorial text for more competitions (`config/comp-extra.ts`) |
| `/zapas/{slug}-{id}/` | Match: current comparison, recorded history, chart | "{tým} vs {tým} kurzy" | index when we have history; stays indexable after kick-off until cleanup (`HISTORY_DAYS`, 30), then 410; `?…` noindex; wrong slug 301 | upcoming matches | lists, competition | – |
| `/tipsport-zapas/{id}/` | 301 helper for sportstreamy.cz | – | not indexable (redirect), disallowed | no | sportstreamy | – |
| `/bonusy/`, `/bonusy/{book}/` | Verified welcome-bonus terms | "{kancelář} bonus za registraci" | `/bonusy/` index; `/{book}/` index while its terms are fresh (≤ 21 days), else noindex | `/bonusy/` + fresh ones | nav, reviews, home | MerkurXtip after verification |
| `/sazkove-kancelare/`, `/{book}/`, `/srovnani/`, `/legalni/`, `/tipsport-vs-chance/` | Bookmaker facts with sources, MF licence list, comparison | brand + "recenze", "legální sázkové kanceláře" | index | yes | nav, footer | – |
| `/pruvodce/`, `/pruvodce/{slug}/` | Guides | explanatory ("handicap", "cash out", "daň z výher") | index | yes (`lastmod` = `updated`) | glossary, home, footer | pilot: "jak číst historii kurzů", "implikovaná pravděpodobnost" |
| `/pojem/`, `/pojem/{slug}/` | Glossary | definitions | index | yes | guides, cards | – |
| `/kalkulacky/` | Calculators | "kalkulačka kurzů" | index; with values noindex | yes | nav, guides | – |
| `/metodika/`, `/o-nas/`, `/financovani/`, `/odpovedne-hrani/`, `/soukromi/`, `/cookies/` | Trust and legal | – | index | yes | footer | – |
| `/hledat/` | Search results | – | noindex, disallowed | no | header | – |
| `/oblibene/` | Followed items (browser only, nothing on the server) | – | noindex, disallowed | no | header | – |
| `/go/{book}/`, `/api/*` | Partner redirects, JSON | – | disallowed, `X-Robots-Tag: noindex` | no | – | – |

Notes
- Filter and pagination URLs are **not** disallowed (Google must be able to read their `noindex`).
- Structured data: `BreadcrumbList`, `Article`/`WebPage` with real dates, `FAQPage` only where the answers are visible text, `ItemList`, `DefinedTerm`. Match pages: `WebPage` about a `SportsEvent` without invented venue. No ratings, no `Review` stars. No rich result is promised.
- Not built on purpose: one page per keyword variant, team pages without own data, league tables (no source).
