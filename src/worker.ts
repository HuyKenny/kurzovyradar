/**
 * The SSR app as a local renderer (since 23. 11. 2026). Production serves static files built from it: a GitHub Actions job
 * (`.github/workflows/build.yml`, `scripts/static.py`) runs this Worker with `wrangler dev --local` over the SQLite state,
 * triggers the odds import through the scheduled handler, fetches every page and deploys the HTML as static assets behind the tiny
 * production Worker in `edge/worker.js`. Nothing here runs on Cloudflare any more.
 */
import { handle } from '@astrojs/cloudflare/handler';
import type { Env } from './server/types';
import { runImport } from './server/run';
import { seedDemo } from './server/demo';
import { securityHeaders } from './lib/security';

function finish(res: Response, env: Env): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(securityHeaders())) if (!out.headers.has(k)) out.headers.set(k, v);
  const ct = out.headers.get('Content-Type') ?? '';
  if (ct.startsWith('text/html') && !/charset/i.test(ct)) out.headers.set('Content-Type', 'text/html; charset=utf-8');
  if (env.ENVIRONMENT !== 'production') out.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return out;
}

async function serve(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });
  }
  return finish(await handle(request, env as never, ctx), env);
}

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => serve(request, env, ctx),
  async scheduled(_ev: ScheduledController, env: Env) {
    // Awaited (not waitUntil): the static build waits for the import before it renders the pages.
    // Demo never touches the feeds and production can never seed demo data.
    const job = env.DEMO === 'on' && env.ENVIRONMENT !== 'production' ? seedDemo(env) : runImport(env);
    try {
      console.log('import', JSON.stringify(await job));
    } catch (e) {
      console.error('import failed', String(e));
      throw e;
    }
  },
};
