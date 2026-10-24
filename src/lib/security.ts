/**
 * Security headers for SSR responses (src/worker.ts); public/_headers mirrors them for static files.
 * Third party: only Google Analytics (gtag.js), loaded after consent (components/Souhlas.astro); everything else is self-hosted (fonts, images, icons). Scripts are external files only
 * (vite assetsInlineLimit 0), so script-src needs no 'unsafe-inline'; JSON-LD blocks are data, not script.
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'inline-speculation-rules' https://www.googletagmanager.com",
  "img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

export function securityHeaders(): Record<string, string> {
  return {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Content-Security-Policy': CSP,
  };
}
