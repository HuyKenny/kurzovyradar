# Vizuální podklady a jejich původ

| Soubor | Původ | Licence / atribuce |
|---|---|---|
| `public/favicon.svg`, symbol v `src/components/Logo.astro` | Vlastní geometrický symbol (radarový kvadrant, paprsek, sledovaný bod), ručně kreslené SVG | vlastní |
| `public/favicon-32.png`, `apple-touch-icon.png`, `icon-192/512.png` | `scripts/assets.mjs` ze `favicon.svg` (sharp) | vlastní |
| `public/og/default.png` | `scripts/assets.mjs` (satori + Inter) | vlastní |
| `public/fonts/inter-latin*.woff2`, `src/fonts-og/*.ttf` | Inter z `@fontsource-variable/inter`, podmnožina pro češtinu `scripts/fonts.py` (zachována `tnum`) | SIL OFL 1.1 |
| Ikony (`src/lib/icons.ts`) | `lucide-static` 0.545.0, `scripts/icons.mjs` | ISC |
| `public/img/foto/hero-*` | Pexels #28827841, Siarhei Nester – osvětlený prázdný stadion | Pexels License, autor uveden na /o-nas/ |
| `public/img/foto/fotbal-*` | Pexels #33210166, 李 先生 – hřiště shora | Pexels License |
| `public/img/foto/hokej-*` | Pexels #6539276, Pavel Danilyuk – prázdná hokejová hala | Pexels License |
| `public/img/foto/pruvodce-*` | Pexels #434633, Pixabay – modré sedačky | Pexels License |
| `public/img/loga/tipsport.webp` | Oficiální brandová dlaždice Tipsportu, již v portfoliu (`apps/spinydnes/public/wp-content/uploads/2025/09/tipsport.webp`, 1080 px), oříznutá na pruh se značkou, barvy beze změny (`scripts/logos.mjs`) | ochranná známka Tipsport, použito k identifikaci partnera |
| `public/img/loga/chance.webp` | Oficiální dlaždice Chance z portfolia (`…/2025/09/chance-logo-1.png`), oříznutí stejně | ochranná známka Chance |
| `public/img/loga/allwyn.webp` | Oficiální SVG cesty loga z hlavičky allwyn.cz (staženo 23. 10. 2026), barvy z jejich CSS (`#5de9d9` ikona, `#27e2cc` text, `#1d4757` podklad) | ochranná známka Allwyn |

- Fotky jsou jen ilustrační atmosféra a nikde se nevydávají za snímek konkrétního zápasu. Návštěva webu Pexels nevolá, soubory jsou lokální (AVIF + WebP, 480/800/1280 px, pevný poměr 16:9).
- **Canva MCP** nebyl v prostředí přihlášený (jen `authenticate`). Symbol a OG obrázek jsou proto vlastní SVG a satori. AI generované fotky ani napodobeniny log se nepoužily.
- **Loga:** oficiální weby tipsport.cz a chance.cz vrací Malině 403 a rozšíření Chrome nebylo připojené. Proto se použily ověřené soubory portfolia. Až budou brand kity z partnerských panelů, nahradit soubory v `public/img/loga/` a spustit `node scripts/logos.mjs`.
- Fortuna a Betano nemají ověřené logo → zobrazují se jako text (`BookLogo.astro`).
- Barvy grafů: Tipsport `#2457ff` (plná čára, kruhy), Chance `#d4590f` (čárkovaná čára, čtverce). Validováno skriptem dataviz `validate_palette.js` (CVD ΔE 33,5, kontrast ≥ 3:1).
