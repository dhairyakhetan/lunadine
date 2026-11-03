# CLAUDE.md — Luna Dine website

Marketing site for **Luna Dine** ("Beyond Fine Dining"), a new exotic multicuisine restaurant at 140/2 Salkia School Road, Howrah 711101 (opened 2026). It has two pages: home (`/`) and the full menu (`/menu`). It is deployed on Vercel.

`/menu` is what the **table QR codes** open, so it is deliberately **only the menu**: logo, kitchen promise, an **All / Veg / Non-veg** filter in the sticky bar, and the sections. The filter hides groups of the other diet. Drinks (`t: "x"`) show in every mode. Changing the filter returns you to the start of the menu. The chosen filter is kept for the tab (sessionStorage `ld-diet`), so a refresh or Back keeps it; an inline script in `layout.tsx` sets `html.diet-v`/`.diet-n` before paint and CSS hides the other diet (via `data-v`/`data-n`/`data-t`) until React renders, so there's no flash or jump. No site nav, search, filters, footer or dock. Keep it that way.
- **Desktop/tablet (>700px):** a sticky row of section chips above the sections, which sit on separate paper cards. The chips row fades an edge only while more chips are hidden past it (`--fl`/`--fr`), and the active chip is centred by measuring against the row itself.
- **Phones (≤700px):** a separate layout. The sticky bar holds only the filter and is a fixed 56px tall; the sticky section titles sit at `top:55px`, so change both together. It's one continuous edge-to-edge menu card, and each section title is sticky while you're in that section. Dish rows are two lines (name and price, then details like "8 pc" underneath). The chips row is hidden. A floating **Sections** pill at the bottom shows the current section and opens a bottom sheet listing every section with its dish count. Drag the sheet's header down to close it.

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
| `lib/site.ts` | Phone, email, address, map links, socials, and `url` (**`https://luna-dine.vercel.app`**). `url` drives OG images, the sitemap and JSON-LD, and review mode stays hidden on that host. Change it if the domain changes, then redeploy. |
| `app/layout.tsx` | Fonts, metadata/OG, the inline intro-skip script, `<SmoothScroll/>` |
| `app/page.tsx` | Home: intro → hero (starfield + arch video) → marquee → story (moon + word lighting) → "The Room" horizontal gallery → signature dishes → visit/map → footer + mobile dock. Also holds the JSON-LD `Restaurant` schema. |
| `app/menu/page.tsx` + `components/MenuBrowser.tsx` | QR menu: small header (logo, kitchen promise), then a client component with sticky section chips (scrollspy) and the menu sections. Review mode lives here too. |
| `components/PageFX.tsx` | Page-level scroll effects (reveals, count-up, story/moon, lazy map, video play-on-screen, dock/to-top). Runs on whatever markup the page has and cleans up on unmount. |
| `components/SmoothScroll.tsx` | Lenis instance on `window.LD.lenis`. A link to another page starts at the top; Back/Forward returns to the last scroll position on that page; a reload keeps the browser's own restoration. An old `#hash` URL still lands on its section, then the hash is stripped. |
| `lib/scroll.ts`, `components/ScrollTo.tsx` | `scrollToId()` and a `<ScrollTo to="visit">` button: smooth-scroll to a section **without changing the URL**. |
| `components/Nav.tsx`, `Sky.tsx`, `Chrome.tsx` (Footer, Dock), `Brand.tsx` (logo SVG paths), `Icons.tsx` | Shared UI |
| `public/img/og-home.jpg`, `og-menu.jpg` | Social share images (1200×630) for `/` and `/menu`, rendered by `scripts/og-images.js` (needs Playwright, which isn't a project dependency). The menu one shows five real dishes and prices. If those change, update the script and re-run it, and give the files new names, because `/img/*` is cached for a year. |
| `public/img`, `public/video` | Interior stills + 12.8 s hero clip (540×960 H.264, ~700 KB), all cut from the restaurant's opening video. `public/luna-dine-menu.pdf` is the downloadable printed menu. |

## Gotchas (read before editing)
1. **Never toggle classes with `classList` on an element whose `className` React controls.** The next re-render wipes them. That's why the active chip (`on`) and the review-mode flags are React state in `MenuBrowser`. PageFX only touches server-rendered static markup and `<html>`.
2. **Global state lives as classes on `<html>`:** `no-intro` (skip intro; sets `--intro:0s`), `menu-open` (mobile sheet), `nav-gone` (nav hidden on scroll-down), `diet-v`/`diet-n` (saved menu filter, only until React takes over). Set them only via `document.documentElement`.
3. **Intro timing:** hero animations wait `var(--intro)` (1.45 s). An inline script in `layout.tsx` adds `no-intro` before paint for returning visitors (sessionStorage `ld-intro`), reduced-motion users, and any path other than `/`. `PageFX noIntro` adds it again after client-side navigation. `<html>` has `suppressHydrationWarning` for this reason, so don't remove it.
4. **Scrolling:** Lenis drives native window scroll, so `window.scrollY` and `scroll` events stay accurate. To scroll in code, use `window.LD?.lenis?.scrollTo(...)` with a `window.scrollTo` fallback (Lenis is `null` under reduced motion). After content height changes, call `lenis.resize()`.
5. **No `#hash` links, anywhere.** In-page navigation uses `ScrollTo` buttons (`Nav` turns `href: "#id"` props into them) or `scrollToId()`, and the URL never changes.
10. **"The Room"** is a pure-CSS auto-scrolling reel. The cards are rendered twice and the track animates to `-50%`. Each card carries its own right margin (not `gap`), so the two halves are exactly equal and the loop is seamless. It pauses on hover. Under reduced motion it stops and becomes swipeable.
6. **Respect `prefers-reduced-motion`** everywhere. There's already a global CSS override, and JS effects check `matchMedia`.
11. **Hover effects go inside `@media (hover:hover)`.** On phones a tap triggers `:hover` and leaves it stuck (e.g. a signature dish card stays navy). Touch gets a short `:active` press-in instead, and the tap highlight is off.
7. **Breakpoint** is 860px (nav → burger, hero video becomes full-bleed, dock appears). Below it the starfield canvas is `display:none`, because the full-bleed video covers it.
8. **`backdrop-filter`: write `-webkit-backdrop-filter` first, then `backdrop-filter`.** The build's CSS minifier keeps only the last of the pair. With the standard one first, Chrome, Edge and Android got no blur at all.
9. **Menu jumps** (chips, review "Show") use `scrollUnderBar()` in `MenuBrowser`, which measures layout position (`offsetTop`), so transforms can't throw it off. The home nav only changes state when the scroll position actually changes.

## Design system
- **Colours:** night `#080d1b`, navy `#1b2540` (brand), cream `#f4ecda`, paper `#efe5cd` (+ `/img/paper.webp` multiplied), gold `#f3c37c` (from the illuminated signage), ember `#d4694e`. Veg/non-veg marks use the Indian standard green dot / red triangle (`.vg`, `.vg.n`).
- **Motifs:** arches (`border-radius:999px 999px …`, echoing the restaurant's lit Pichwai arches), the moon, stars, and the deer emblem. Dark night sections alternate with cream "menu card" paper sections.
- **Motion:** easing `cubic-bezier(.22,1,.36,1)`, ~1.1 s reveals, nothing bouncy.
- **Logo:** `components/Brand.tsx` holds paths vector-traced from the printed menu. They use `currentColor`. Don't redraw or restyle the mark.

## Review mode (menu issues)
`lib/menu-issues.ts` lists the open questions about menu names and prices. On `/menu`, a floating **Menu issues** button (bottom right) opens that list, and flagged dishes get a red **?** and a wavy underline. It only shows when the hostname isn't the production host (passed from the server as `prodHost`, so localhost and preview deploys), or when the URL has `?review` (e.g. `/menu?review`). Customers on the real domain never see it, and it also stays hidden while the list is empty. When the owner answers a question, update `lib/menu.ts` and delete the entry from `lib/menu-issues.ts`.

## Kitchen promise
Owner-supplied claims shown in the menu header: No Ajinomoto, no trans fat, no food colour, and a separate chef and utensils for the vegetarian menu. Don't extend or reword them as stronger claims without the owner.

## Content rules
- **Don't invent facts.** Opening hours are unknown, so they're intentionally absent. Don't add hours, ratings, reviews, awards, chef names, or "since" claims unless the owner provides them.
- **People in imagery:** the source video includes a puja ceremony with family members and children. Only interior and signage frames are used, and it should stay that way.
- **Menu text:** spelling was normalised from the printed card (e.g. Schwezan → Schezwan, Puloa → Pulao). The owner has confirmed these, so don't "correct" them:
  - **Continental** noodles (printed "Continuos") and **Salanto** gravies (printed "Salanta"/"Salanto").
  - **Moon Fan** fried rice, the **Royal Hummer** mocktail, **Burnt Garlic Noodles**, and **Dewani** Handi are correct as named.
  - The non-veg Chinese gravy rows printed twice on the card were identical, so one copy of each is right.
  - Egg Fried Rice is ₹240 and Egg Schezwan Fried Rice is ₹250 (the card had them swapped). Cucumber Salad ₹150 and the Diet Coke 330 ml can are correct.
  - No menu questions are open right now (`lib/menu-issues.ts` is empty).
- Signature-dish descriptions on the home page were written for the site. The owner may revise them.

## Housekeeping
- **Git: commit and push straight to `main`.** Don't create or push other branches.
- **Always push to `main`**, even if a session, tool or task setup names a feature branch (e.g. `claude/...`). If work has ended up on another branch, fast-forward it onto `main` and push `main`.
- Don't commit `node_modules`, `.next`, or `.vercel` (already in `.gitignore`).
