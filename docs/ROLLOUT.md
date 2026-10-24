# Rollout and rollback (25. 10. 2026)

## What shipped
Commit `4a9a6b7` (repo `HuyKenny/kurzovyradar`), deployed 25. 10. 2026 00:44 with `bin/kurzovyradar-deploy.sh` (tests → build → D1 migrations → deploy → check that the homepage carries the new build id), followed by a zone cache purge. No migration; no stored data changed shape.

## How to verify after a deploy
- `curl -s https://kurzovyradar.cz/robots.txt` – no `Disallow: /*?`.
- `/radar/?pohled=rozdily` – count equals the number of differing current pairs in D1:
  `SELECT COUNT(*) FROM offers t JOIN offers c ON … WHERE t.odds <> c.odds AND … removed_at IS NULL` (25. 10.: 2 = 2).
- Worker logs after each cron (`4,19,34,49`): `import {...}`; a `collapse:` error means the guard rejected a run (check the provider).
- `/oblibene/`: follow a bet, open the page in a background tab, switch to it, the baseline moves only after it is visible.

## Switches (no redeploy of logic needed, only vars in `wrangler.jsonc`)
| Var | Default | Effect |
|---|---|---|
| `MAX_SKEW_MIN` | 20 | Gap between the books' last checks above which they are not compared. A very high value (e.g. 999) restores the old behaviour. |
| `STALE_AFTER_MIN` | 45 | Age after which a book's prices stop counting. |
| `HISTORY_DAYS` | 30 | Detail rows kept; a match page answers 410 after this. |
| `CACHE_TTL_S` | 600 | Edge cache of SSR pages. |

The collapse guard has no var: to disable it set `COLLAPSE_RATIO = 0` in `src/server/run.ts`.

## Rollback
- Code: `git revert 4a9a6b7 && bin/kurzovyradar-deploy.sh` (or redeploy the previous commit). Data is unaffected by this commit.
- A single rule: change the var above and redeploy (`bin/kurzovyradar-deploy.sh`).
- Cloudflare zone settings (WAF, redirect, DNSSEC) have a backup in `~/ai/backups/kurzovyradar/cf-zone-before-hardening-2026-10-24.json`.

## Not done, and what it needs
- **Notifications (P1).** Today the target price is evaluated only when the visitor opens the site, and the page says so. A real alert needs: VAPID key pair as Worker secrets, a D1 table `push_rules (id, endpoint_hash, subscription_enc, event_id, market, outcome, target, created_at, last_sent_at, active)`, opt-in UI on the match page after an explicit click (never on first visit), evaluation in the import cron only on current offers (`isCurrent`), dedup by `(rule, price)`, at most one message per rule per 6 h, quiet hours 22–8, auto-stop at kick-off, unsubscribe per rule and all. The same pattern runs on spinydnes.cz (D1 push). Cost: Workers + D1 writes within the current plan; no paid service. Not built in this round: needs a product decision on wording and a consent text.
- **Content pilot.** Guides "jak číst historii kurzů" and "co říká implikovaná pravděpodobnost" and a weekly data report ("zaznamenané pohyby v soutěži X za týden") wait for at least 14 days of history; the report must state period, number of matches and markets, books, check frequency and gaps.
- **Analytics events.** GA4 runs only after consent and already gets `affiliate_click`; radar filter, follow and detail events are not sent yet. Server click counts (Analytics Engine) stay the source of truth for clicks; clicks are not registrations.
- **Ops view.** Import health is in D1 (`import_runs`, `book_state`) and Worker logs; there is no dashboard page.

## Running costs
No new paid service. Workers (requests, CPU), D1 (one extra small `import_runs` read per book per run, one per derive), KV for pre-rendered pages (~3 000 writes/day), all on the existing Cloudflare plan.
