# CLAUDE.md — Luna Dine website

Marketing site for **Luna Dine** ("Beyond Fine Dining"), a new exotic multicuisine restaurant at 140/2 Salkia School Road, Howrah 711101 (opened 2026). It has two pages: home (`/`) and the full menu (`/menu`). It is deployed on Vercel.

`/menu` is what the **table QR codes** open, so it is deliberately **only the menu**: logo, kitchen promise, a sticky row of section chips, and the sections. No site nav, search, filters, footer or dock. Keep it that way.

The owner's brief: **fast, smooth, and impressive**. Every change must keep the site fast, so check the performance impact before adding weight.

## Commands
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # must pass with zero TypeScript errors before any handoff
npm run start    # serve the production build
```
There is no lint step and no test suite. To verify, run `npm run build`, then check both pages in a browser at desktop (1440×900) and phone (390×844) sizes.

## Stack
- **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript 5.9**. Both routes are statically pre-rendered (`○ Static`), so keep it that way: no `cookies()`, `headers()`, or uncached fetches in pages.
- **Lenis** for smooth wheel scrolling. It's the only runtime dependency besides Next/React.
- Fonts come through `next/font/local` from woff2 files in `app/`: Instrument Serif (display) and Outfit (body). The CSS vars are `--font-serif` and `--font-sans`.
- Styles are plain CSS in `app/globals.css`. There's no Tailwind and no CSS-in-JS, and none should be added.

## Map
| Path | What |
|---|---|
| `lib/menu.ts` | **Source of truth for the menu.** `MENU` array of sections → groups → items `[name, price, note?]`. `t`: `"v"` veg, `"n"` non-veg, `"x"` neutral (drinks). `TOTAL_DISHES` and `TOTAL_SECTIONS` are derived from it, so don't hardcode counts anywhere. |
| `lib/site.ts` | Phone, email, address, map links, socials, and `url`. `url` comes from Vercel's `VERCEL_PROJECT_PRODUCTION_URL` at build time, so OG images, the sitemap and JSON-LD always use the live domain. It's server-only, so pass values to client components as props. |
| `app/layout.tsx` | Fonts, metadata/OG, the inline intro-skip script, `<SmoothScroll/>` |
| `app/page.tsx` | Home: intro → hero (starfield + arch video) → marquee → story (moon + word lighting) → "The Room" horizontal gallery → signature dishes → visit/map → footer + mobile dock. Also holds the JSON-LD `Restaurant` schema. |
| `app/menu/page.tsx` + `components/MenuBrowser.tsx` | QR menu: small header (logo, kitchen promise), then a client component with sticky section chips (scrollspy) and the menu sections. Review mode lives here too. |
| `components/PageFX.tsx` | Page-level scroll effects (reveals, count-up, story/moon, pinned horizontal room, lazy map, video play-on-screen, dock/to-top, in-page `#anchor` smooth scroll). Runs on whatever markup the page has and cleans up on unmount. |
| `components/SmoothScroll.tsx` | Lenis instance on `window.LD.lenis`. Handles scroll-to-top / `#hash` on client-side navigation. |
| `components/Nav.tsx`, `Sky.tsx`, `Chrome.tsx` (Footer, Dock), `Brand.tsx` (logo SVG paths), `Icons.tsx` | Shared UI |
| `public/img/og-home.jpg`, `og-menu.jpg` | Social share images (1200×630) for `/` and `/menu`, rendered by `scripts/og-images.js` (needs Playwright, which isn't a project dependency). The menu one shows five real dishes and prices. If those change, update the script and re-run it, and give the files new names, because `/img/*` is cached for a year. |
| `public/img`, `public/video` | Interior stills + 12.8 s hero clip (540×960 H.264, ~700 KB), all cut from the restaurant's opening video. `public/luna-dine-menu.pdf` is the downloadable printed menu. |

## Gotchas (read before editing)
1. **Never toggle classes with `classList` on an element whose `className` React controls.** The next re-render wipes them. That's why the active chip (`on`) and the review-mode flags are React state in `MenuBrowser`. PageFX only touches server-rendered static markup and `<html>`.
2. **Global state lives as classes on `<html>`:** `no-intro` (skip intro; sets `--intro:0s`), `menu-open` (mobile sheet), `nav-gone` (nav hidden on scroll-down). Set them only via `document.documentElement`.
3. **Intro timing:** hero animations wait `var(--intro)` (1.45 s). An inline script in `layout.tsx` adds `no-intro` before paint for returning visitors (sessionStorage `ld-intro`), reduced-motion users, and any path other than `/`. `PageFX noIntro` adds it again after client-side navigation. `<html>` has `suppressHydrationWarning` for this reason, so don't remove it.
4. **Scrolling:** Lenis drives native window scroll, so `window.scrollY` and `scroll` events stay accurate. To scroll in code, use `window.LD?.lenis?.scrollTo(...)` with a `window.scrollTo` fallback (Lenis is `null` under reduced motion). After content height changes, call `lenis.resize()`.
5. **"The Room" pinning (desktop >860px only):** PageFX sets the section height to `100vh + trackOverflow` and translates the track on scroll. A ResizeObserver recalculates this. Below 860px it's a native horizontal swipe with scroll-snap.
6. **Respect `prefers-reduced-motion`** everywhere. There's already a global CSS override, and JS effects check `matchMedia`.
7. **Breakpoint** is 860px (nav → burger, hero video becomes full-bleed, dock appears).
8. **`backdrop-filter`: write `-webkit-backdrop-filter` first, then `backdrop-filter`.** The build's CSS minifier keeps only the last of the pair. With the standard one first, Chrome, Edge and Android got no blur at all.
9. **Menu jumps** (chips, review "Show") use `scrollUnderBar()` in `MenuBrowser`, which measures layout position (`offsetTop`), so transforms can't throw it off. The home nav only changes state when the scroll position actually changes.

## Design system
- **Colours:** night `#080d1b`, navy `#1b2540` (brand), cream `#f4ecda`, paper `#efe5cd` (+ `/img/paper.webp` multiplied), gold `#f3c37c` (from the illuminated signage), ember `#d4694e`. Veg/non-veg marks use the Indian standard green dot / red triangle (`.vg`, `.vg.n`).
- **Motifs:** arches (`border-radius:999px 999px …`, echoing the restaurant's lit Pichwai arches), the moon, stars, and the deer emblem. Dark night sections alternate with cream "menu card" paper sections.
- **Motion:** easing `cubic-bezier(.22,1,.36,1)`, ~1.1 s reveals, nothing bouncy.
- **Logo:** `components/Brand.tsx` holds paths vector-traced from the printed menu. They use `currentColor`. Don't redraw or restyle the mark.

## Review mode (menu issues)
`lib/menu-issues.ts` lists the open questions about menu names and prices. On `/menu`, a floating **Menu issues** button (bottom right) opens that list, and flagged dishes get a red **?** and a wavy underline. It only shows when the hostname isn't the production host (passed from the server as `prodHost`, so localhost and preview deploys), or when the URL has `?review` (e.g. `/menu?review`). Customers on the real domain never see it. When the owner answers a question, update `lib/menu.ts` and delete the entry from `lib/menu-issues.ts`.

## Kitchen promise
Owner-supplied claims shown in the menu header: No Ajinomoto, no trans fat, no food colour, and a separate chef and utensils for the vegetarian menu. Don't extend or reword them as stronger claims without the owner.

## Content rules
- **Don't invent facts.** Opening hours are unknown, so they're intentionally absent. Don't add hours, ratings, reviews, awards, chef names, or "since" claims unless the owner provides them.
- **People in imagery:** the source video includes a puja ceremony with family members and children. Only interior and signage frames are used, and it should stay that way.
- **Menu text:** spelling was normalised from the printed card (e.g. Schwezan → Schezwan, Puloa → Pulao). These items are **still waiting on the owner's answers**, so leave them as they are until confirmed:
  - "Continuos" noodles — is it "Continental"?
  - "Salanta" / "Salanto" gravies.
  - "Moon Fan" fried rice.
  - "Royal Hummer".
  - "Burnt Garlic" (the site adds "Noodles").
  - "Dewani" vs "Diwani" Handi.
  - The non-veg Chinese gravy section had 3 rows printed twice; one copy of each is kept.
  - Prices to confirm: Egg Fried Rice ₹250 vs Egg Schezwan ₹240; Cucumber Salad ₹150.
- Signature-dish descriptions on the home page were written for the site. The owner may revise them.

## Housekeeping
- **Git: commit and push straight to `main`.** Don't create or push other branches.
- Don't commit `node_modules`, `.next`, or `.vercel` (already in `.gitignore`).
