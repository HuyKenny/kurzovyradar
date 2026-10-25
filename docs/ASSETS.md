# Vizuální podklady a jejich původ

| Soubor | Původ | Licence / atribuce |
|---|---|---|
| `public/img/art/*.svg` (logo-symbol + 15 ilustrací: fotbal, hokej, radar, kalkulačka, kancelář, kroky, průvodci) | Vlastní samolepkové ilustrace v paletě webu (inkoustový obrys, tvrdý stín), `scripts/art.mjs`, manifest `src/data/art.json` | vlastní |
| `public/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192/512.png` | Logo symbol (tiket s radarem), `scripts/art.mjs` | vlastní |
| `public/og/default.png` | `scripts/assets.mjs` (satori + Familjen Grotesk) | vlastní |
| `public/fonts/familjen-*`, `atkinson-*`, `caveat-*` (+ `src/fonts-og/*.ttf`) | Google Fonts: Familjen Grotesk, Atkinson Hyperlegible Next, Caveat; podmnožina pro češtinu `scripts/fonts.py` (zachovány OpenType vlastnosti, `tnum`) | SIL OFL 1.1 |
| Ovládací ikony (`src/lib/icons.ts`) | `lucide-static` 0.545.0, `scripts/icons.mjs` | ISC |
| `public/img/foto/hero-*` | Pexels #28827841, Siarhei Nester – osvětlený prázdný stadion | Pexels License, autor uveden na /o-nas/ |
| `public/img/foto/fotbal-*` | Pexels #33210166, 李 先生 – hřiště shora | Pexels License |
| `public/img/foto/hokej-*` | Pexels #6539276, Pavel Danilyuk – prázdná hokejová hala | Pexels License |
| `public/img/foto/pruvodce-*` | Pexels #434633, Pixabay – modré sedačky | Pexels License |
| `public/img/loga/tipsport.webp` | Oficiální brandová dlaždice Tipsportu, již v portfoliu (`apps/spinydnes/public/wp-content/uploads/2025/09/tipsport.webp`, 1080 px), oříznutá na pruh se značkou, barvy beze změny (`scripts/logos.mjs`) | ochranná známka Tipsport, použito k identifikaci partnera |
| `public/img/loga/chance.webp` | Oficiální dlaždice Chance z portfolia (`…/2025/09/chance-logo-1.png`), oříznutí stejně | ochranná známka Chance |
| `public/img/loga/allwyn.webp` | Oficiální SVG cesty loga z hlavičky allwyn.cz (staženo 23. 10. 2026), barvy z jejich CSS (`#5de9d9` ikona, `#27e2cc` text, `#1d4757` podklad) | ochranná známka Allwyn |

- Fotky jsou jen ilustrační atmosféra a nikde se nevydávají za snímek konkrétního zápasu. Návštěva webu Pexels nevolá, soubory jsou lokální (AVIF + WebP, 480/800/1280 px, pevný poměr 16:9).
- **Canva MCP** se 23. 10. 2026 nepodařilo přihlásit (konektor claude.ai Canva hlásil „unauthorized“). Logo, favicon a ilustrace jsou proto vlastní SVG (`scripts/art.mjs`). Až bude Canva připojená, stačí nahradit soubory v `public/img/art/` a záznamy v `src/data/art.json` (komponenta `Art.astro` je načítá podle jména). AI fotky ani napodobeniny log se nepoužily.
- **Loga:** oficiální weby tipsport.cz a chance.cz vrací Malině 403 a rozšíření Chrome nebylo připojené. Proto se použily ověřené soubory portfolia. Až budou brand kity z partnerských panelů, nahradit soubory v `public/img/loga/` a spustit `node scripts/logos.mjs`.
- `public/img/loga/{fortuna,betano,fbet,synottip,betx,betor}.webp` (25. 10. 2026): čtvercové brandové dlaždice, které už používá spinydnes.cz (`apps/spinydnes/public/wp-content/uploads/…`), jen zmenšené na 128 px (`scripts/logos-portfolio.mjs`); `kingsbet.webp`: oficiální tmavý wordmark SVG na bílém. Ochranné známky provozovatelů, použité k identifikaci kanceláře.
- bet365 logo nemá (neodkazujeme na ni, zobrazuje se text).
- Barvy grafů: Tipsport `#1f6fe0` (plná čára, kruhy), Chance `#0e6b47` (čárkovaná čára, čtverce). Validováno skriptem dataviz `validate_palette.js` (prošlo, kontrast ≥ 3:1). Paleta webu: papír `#f6f4ee`, inkoust `#16201b`, zelená `#0e6b47`, oranžová `#ff6b1a`; kontrast textu 4,7–15:1.
