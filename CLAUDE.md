# CLAUDE.md — Luna Dine website

Marketing site for **Luna Dine** ("Beyond Fine Dining"), a new exotic multicuisine restaurant at 140/2 Salkia School Road, Howrah 711101 (opened 2026). Two pages: home (`/`) and the full menu (`/menu`, what the **table QR codes** open). Deployed on Vercel.

The owner's brief: **fast, smooth, and impressive**. Every change must keep the site fast, so check the performance impact before adding weight.

## Commands
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # must pass with zero TypeScript errors before any handoff
npm run start    # serve the production build
```
There is no lint step and no test suite. To verify, run `npm run build`, then check both pages in a browser at desktop (1440×900) and phone (390×844) sizes. Chromium and Playwright are preinstalled in cloud sessions; for the menu, check that switching All / Veg / Non-veg keeps the first dish under the bar on the same pixel and that a round trip returns to the same `scrollY`.

## Stack
- **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript 5.9**. Both routes are statically pre-rendered (`○ Static`); keep it that way: no `cookies()`, `headers()`, or uncached fetches in pages.
- **Lenis** for smooth wheel scrolling, the only runtime dependency besides Next/React.
- Fonts via `next/font/local` from woff2 files in `assets/fonts/`: Instrument Serif (display) and Outfit (body); CSS vars `--font-serif`, `--font-sans`.
- **Assets are fingerprinted by the build.** Every file the pages use lives in `assets/` and is imported, so its URL carries a hash of its content (`/_next/static/media/name.<hash>.ext`, cached for a year): change a file and its URL changes, so nothing is ever stale and nothing needs renaming. Images: `import x from "@/assets/img/x.webp"` (then `x.src`, or pass `x` to `next/image`, which also gets its size); CSS: `url(../assets/img/x.webp)`; video: `new URL("../assets/video/x.mp4", import.meta.url).pathname`. `public/` is only for files that need a fixed address (the PDF menu, `/favicon.ico`, the IndexNow key file); they're served with no long cache, so they're always current.
- Styles are plain CSS in `app/globals.css`. No Tailwind, no CSS-in-JS, and none should be added.
- Client JS is only: `SmoothScroll` (every page), `PageFX` + `Nav` + `Sky` + `ScrollTo` (home), `MenuBrowser` (menu). Everything else is server-rendered. Keep big static markup (the logo paths in `Brand.tsx`) out of client components: pass it in as a prop/children from a server component, as `app/page.tsx` does with `<Nav brand=…>`.

## Code map
Look here first; the names in `backticks` are the functions/constants to search for.

**Shared**
| File | What's in it |
|---|---|
| `app/layout.tsx` | Fonts, site metadata/OG, `<SmoothScroll/>`. `introScript`: inline, runs before paint: adds `no-intro` (returning visitor in this tab, reduced motion, or any path but `/`) and, on `/menu`, `diet-v`/`diet-n` from sessionStorage `ld-diet`. `noScriptCss`: shows reveal-hidden content without JS. |
| `app/globals.css` | All styles, in page order: tokens (`:root`), type, buttons, intro, nav, hero, marquee, story, room/portal, signatures, visit, footer, dock, reveals, then **MENU PAGE** (header, promise, sticky bar, filter + thumb, ghost layers, the diet filter block, sections, review mode, phone layout), then reduced motion and the backdrop-filter fallback. |
| `lib/scroll.ts` | `reducedMotion()`, `pageTop(el)`, `scrollToY(y)` (smooth; instant under reduced motion), `jumpToY(y)` (instant), `scrollToId(id)`. Use these, never `window.scrollTo` directly. |
| `components/SmoothScroll.tsx` | Lenis on `window.LD.lenis` (`null` under reduced motion). Navigation placement: a new page starts at the top, Back/Forward returns to the last `scrollY` on that page (`lastY`, `popY`), reload keeps the browser's restoration, an old `#hash` URL lands on its element then the hash is stripped. Adds `no-intro` on any client-side navigation, so the intro plays once. Sets sessionStorage `ld-intro`. |
| `components/Icons.tsx` | Stroke icons (`I…`) and `Veg` (the veg / non-veg mark; `quiet` = aria-hidden). |
| `components/Brand.tsx` | Logo paths traced from the printed menu (`EMBLEM_D`, `WORDMARK_D`, `TAGLINE_D`, `ORNAMENT_D` + `_VB`), made into components by `mark()`. `qr/qr-maker.py` regex-reads the `*_D`/`*_VB` lines, so keep that format. |
| `components/Chrome.tsx` | `KitchenPromise` (both pages), `Footer`, `Dock` (home). |
| `lib/site.ts` | `SITE`: name, `alternateNames` and `description` (for search engines), phone, email, address, map links, socials, `url` (= `PROD_URL`, **`https://luna-dine.vercel.app`**), `review`, `verify` (search-engine ownership codes). `PLACE_ID` (`ChIJFzt_VTh3AjoR3bkTkOzmTEg`, Luna Dine's Google Maps listing; derived from the listing link's `0x…:0x…` id, no Business Profile needed) drives `maps` (opens the listing: directions, Find us, the dock) and `reviewWeb` (Google's "write a review" box in the browser, `search.google.com/local/writereview?placeid=…`, the fallback button on `/review`). `review`, where `/review` sends people, is `g.page/r/Cd25E5Ds5kxIEAE/review`: the Business-Profile-style link, built from the listing's CID (base64 of `09` + CID little-endian + `10 01`), which on Android opens the Maps app's review box; not yet confirmed on a phone, so if it fails, point `review` at `reviewWeb`. `LAT`/`LNG` are the listing's pin (Plus Code H8RV+R7), used by the map embed and the JSON-LD `geo`. |
| `next.config.ts` | Image formats for `next/image` (AVIF, WebP); no custom cache headers (see "Assets are fingerprinted"). |
| `app/review/route.ts` | `/review`, where the review QR codes point: a tiny static HTML page (no React, `force-static`) that sends the reader on to `SITE.review` in the same tab (`location.replace`, so Back doesn't bounce them here again). Before leaving it rewrites its own address to `/` (`history.replaceState`): if Google's link opens the Maps app, the tab left behind is the home page, so a background-tab reload never re-opens the app; coming back to that tab (or restoring it from the back/forward cache) loads the home page. Don't turn it back into a server redirect: that's what left tabs re-opening the app. |

**Home (`/`)**
| File | What's in it |
|---|---|
| `app/page.tsx` | Content constants at the top (`MARQUEE`, `ROOM`, `PORTAL`, `DISHES` (price and veg mark looked up in `MENU`), `STORY`, `jsonLd`), then the page: intro → hero (`Sky` starfield + arch video, moon) → marquee → story (moon + word lighting, stats) → "The Room" (`.portal` "Step inside", then the `.room__reel` gallery) → signatures → visit/map → `Footer` + `Dock`. `Letters` splits dish names for the lit animation; `delay(s)` sets `--d`. |
| `components/PageFX.tsx` | All home scroll effects on server markup: `watch()` IntersectionObservers (reveals → `.is-in`, touch-screen `.is-lit` dishes, video play/pause, lazy map iframe, count-up), the portal (`measure`, `place`, `portalFrame`), and one rAF `frame()` per scroll (story words + moon `--p`, portal, dock `.is-on`). Home only. |
| `components/Nav.tsx` | Fixed bar + phone sheet. State on `<html>`: `nav-solid`, `nav-gone`, `menu-open`. `links` come from `app/page.tsx`. |
| `components/Sky.tsx` | Hero starfield canvas: one rAF loop at most (`start()`), only while on screen and the tab is visible; one still frame under reduced motion. |
| `components/ScrollTo.tsx` | A button that calls `scrollToId()`; used instead of `#hash` links. |

**Menu (`/menu`)**
| File | What's in it |
|---|---|
| `lib/menu.ts` | **Source of truth for the menu**: `MENU` sections → groups (`t`: `"v"` veg, `"n"` non-veg, `"x"` drinks) → items `[name, price, note?]`. `titles: { v?, n? }` renames a section under a filter. `TOTAL_DISHES`, `TOTAL_SECTIONS` are derived; never hardcode counts. |
| `lib/menu-issues.ts` | `MENU_ISSUES`, the open owner questions for review mode (empty now). |
| `app/menu/page.tsx` | Metadata, the header (logo in a gold arch on a static starfield, `KitchenPromise`), `<MenuBrowser prodHost=…/>`. |
| `components/MenuBrowser.tsx` | Everything interactive on the menu. In file order: **module data** (`phase`, `phone`, `shown`, review `FLAGS`, the filter's `FILTERED`, `DIET_ATTRS`, `PHASES`, `SecTitle`, animation `MOVERS`/`keyOf`); **position helpers** (`underBarY`, `scrollUnderBar`, `stuckHead`, `readingLine`, `spyId`); **keeping your place** (`capture`, `placeY`, `home`); **switch animation** (`snapshot`, `ghostLayer`, `animateChips`, `animateSwitch`); **chips** (`centerChip`); **filter** (`placeThumb`, `switchMode`, the restore effect, the mode effect); **scrollspy**; **phone sheet + pill** (`jump`, `fitPill`); **review mode** (`showIssue`); then `list` (the dish rows, memoised) and the JSX. |

**Other**: `qr/` holds the printable codes (`luna-menu.png` → `/menu`, `luna-review.png` desk sticker → `/review`) and `qr-maker.py`, which makes both (`pip install segno playwright`, then `python qr/qr-maker.py`); not served. `assets/img`: interior stills (720×1280, cut from the restaurant's opening video), `paper.webp`, the share images `og-home.jpg` / `og-menu.jpg` (1200×630; their generator was removed and is in git history as `scripts/og-images.js` before the `qr/` cleanup), `favicon.svg` and `apple-touch-icon.png` (180×180, the favicon drawn square). `assets/video`: the 12.8 s hero clip (540×960 H.264, ~700 KB) and its poster. `assets/fonts`: the three woff2 files. `public/luna-dine-menu.pdf`: the printed menu (not linked from the site at present).

## How the menu page works
`/menu` is deliberately **only the menu**: logo, kitchen promise, an **All / Veg / Non-veg** filter in the sticky bar, the sections. No site nav, search, other filters, footer or dock. Keep it that way, and keep it free of scroll-driven effects: its mood comes from static touches (each section's small moon waxes from a crescent at the first section to full at the last, `phase()`; the first desktop card has a low arched top).
- **The filter is pure CSS.** The full menu is rendered once; `html.diet-v` / `.diet-n` hide the other diet's groups (`data-t`), sections, chips and sheet tiles (`data-v`/`data-n` group counts from `DIET_ATTRS`). A switch flips the class and re-renders no dish rows. Chips, pill and sheet come from `FILTERED[mode]`. Drinks (`t: "x"`) show in every mode. A section named differently under a filter renders all its names as `.tm` spans (`SecTitle`); CSS shows the current one. Each section's moon phase for each mode is a CSS var (`--pa`/`--pv`/`--pn`, `PHASES`).
- **Remembered for the tab** (sessionStorage `ld-diet`): `introScript` sets the class before paint on a fresh load; the restore effect sets it after a client-side navigation and puts `mode` in step. Neither moves anything or animates.
- **Keeping your place** on a switch: `switchMode()` calls `capture()` (the first dish under the bar and where it is on screen; or the section, when its title is in view), then the mode layout effect calls `placeY()` before paint: the same dish lands on the same pixel, or the next dish in that section still shown, or the start of that section, or (section filtered out) the nearest remaining section in either direction, the later one winning a tie. Switching back and forth without scrolling always places from where you were before the first switch (`home`), so a round trip lands on the exact same `scrollY`. It's forgotten when you scroll yourself or resize (scrolls in the 400 ms after a switch are ours, `ourScrollUntil`). Code that walks sections or rows must skip hidden ones (`shown()`).
- **The switch animates** (`animateSwitch()`, skipped under reduced motion): the gold pill slides between the buttons leading edge first (`placeThumb()`, two `@property` lengths `--tl`/`--tr` with different timings) and the chosen mark pops; on screen, dishes that stay glide to their new place (up to about a screen; further, they leave and arrive instead), leavers squash out as copies in a `ghostLayer()` clipped below the bar (follows scrolling; freezes when the next switch re-anchors), arrivals spring in line by line, desktop cards' paper (`.msec::before`) stretches to its new size, chips glide (`animateChips()`), and the section moons wax or wane (CSS transition). A second tap mid-animation starts from where things are on screen (`snapshot()` reads, then cancels our running animations). Web Animations on transform/opacity only, only for what's visible, never touching React's classes. The diet-filter switch is the one place motion may be squishy (small overshoot), at the owner's request.
- **Desktop/tablet (>700px):** a sticky row of section chips; sections sit on separate paper cards. The row fades an edge only while chips are hidden past it (`--fl`/`--fr`). The current chip is always in view: `centerChip()` centres it from layout (`offsetLeft` inside `.cats`, which is `position:relative`) whenever the section changes, and at once on a switch before the chips animate. If the reader scrolls the row away, it glides back after ~2.5 s of quiet (not while hovered or keyboard-focused); `progUntil` tells our scrolls from theirs.
- **Phones (≤700px):** a separate layout. The bar holds only the filter and is a fixed 56px tall; one continuous edge-to-edge card; each section title is sticky (`top:55px`) while you're in that section; dish rows are two lines. No chips. A floating **Sections** pill (current section, its moon, `n/total`) opens a bottom sheet of every section with dish counts; drag the sheet's header down to close it. The pill's name ticks over in its clipped slot (`.secpill__t`; the old name is a `.secpill__ghost` copy), the count follows, and the pill eases to its new width (`fitPill()` keeps an explicit px width; CSS transitions it). The sheet opens with the current tile centred and the tiles in view rising in (a layout effect, before paint).
- **Menu jumps** (chips, sheet tiles, review "Show") use `scrollUnderBar()` → `underBarY()`, which measures with `pageTop()`. That's safe because sections are never transformed, and `placeY()` runs after `snapshot()` has cancelled the row animations.

## Change these together
- **Menu breakpoint 700px**: `phone()` in `MenuBrowser` ↔ every `max-width:700px` / `min-width:701px` rule in the menu CSS.
- **Menu bar height**: `.mtools{height:56px}` ↔ `.msec__head{top:55px}` (phones) ↔ the `?? 56` fallbacks in `MenuBrowser`.
- **Diet filter**: key `ld-diet` (`DIET_KEY` ↔ `introScript`) · classes `diet-v`/`diet-n` (`introScript`, the restore and mode effects, the CSS "Veg / Non-veg filter" block and `.tm` rules) · `data-v`/`data-n`/`data-t` (`DIET_ATTRS`, list JSX ↔ that CSS block) · `--pa`/`--pv`/`--pn` (`PHASES` ↔ `.mphase` rules) · `.mfilter__all/__v/__n` pre-hydration styles ↔ `MODES`. Chip copies drop `data-v`/`data-n` (`animateChips`) or that CSS would hide them.
- **Switch animation ↔ CSS**: `ghostLayer()` classes `.mghosts`, `.mghosts--back`, `.mchipghosts`, `.mghost-card`; dish copies are wrapped in `ul.items` / `.mgrp` to keep their styles; `.mbody{overflow-anchor:none}` because `MenuBrowser` anchors itself.
- **Home breakpoint 860px**: nav → burger, full-bleed hero video (and `.hero__sky` hidden), dock shown; all in `globals.css`.
- **Intro**: `--intro` (1.45 s) delays the hero animations ↔ `.no-intro{--intro:0s}` ↔ `introScript` ↔ `ld-intro` (set by `SmoothScroll`) ↔ `SmoothScroll` adding `no-intro` on navigation. `<html>` has `suppressHydrationWarning` because of these classes; keep it.
- **Home nav**: `links` ids in `app/page.tsx` ↔ the `<section id>`s there; `html.nav-solid` / `nav-gone` / `menu-open` ↔ their CSS; `.sheet>:nth-child(n)` delays assume five links.
- **Signature dishes "lit"**: the hover list and the `.is-lit` list in `globals.css` are the same rules written twice (hover must stay inside `@media (hover:hover)`); keep them in step. `.is-lit` comes from `PageFX` (touch screens only).
- **The Room portal**: `.portal`/`.portal__stage`/`.portal__arches` boxes in CSS ↔ `measure()` in `PageFX` (reads `offsetLeft/Top`, on resize only).
- **Reveals**: `[data-reveal]`, `.split` ↔ `PageFX` (`.is-in`) ↔ `noScriptCss` ↔ the reduced-motion block at the end of `globals.css`.
- **Kitchen promise**: `KitchenPromise` (one list, both pages) ↔ the `/menu` metadata descriptions and `assets/img/og-menu.jpg`, which quote it.
- **Hours** (daily 11 am – midnight): the Visit section text ↔ `openingHoursSpecification` in `jsonLd` (closes `23:59`).
- **Site URL**: `PROD_URL` in `lib/site.ts` drives OG/canonical URLs, sitemap, robots, JSON-LD, the review-mode host, `qr-maker.py` and the IndexNow command (Search engines section). If the domain changes: update it, redeploy, rerun `qr-maker.py` and reprint.
- **Menu content**: `lib/menu.ts` ↔ `lib/menu-issues.ts` (`items` are exact dish names) ↔ `og-menu.jpg` (shows five real dishes and prices, so remake it if those change) ↔ `DISHES` on the home page (prices and veg marks are looked up by name, `m`; the build fails if a name goes missing).
- **Business details for search engines**: name, address, phone and hours in `jsonLd` (`app/page.tsx`), `SITE` (`lib/site.ts`), the Visit section and the Google Business Profile listing must all match exactly.
- **Paper texture**: `--paper-bg` with `background-blend-mode:multiply` everywhere the menu-card paper appears.

## Search engines (SEO)
What's in place, so "Luna Dine" / "LunaDine" searches find the site:
- **Home page structured data** (`jsonLd` in `app/page.tsx`): a `WebSite` (Google's site name: `SITE.name`, plus `SITE.alternateNames` such as "LunaDine") and a `Restaurant` (name, address, phone, hours, pin, cuisines, price range, menu, Maps link, logo, photos, Instagram/Facebook). Google reads the site name from the home page only. Check changes at validator.schema.org or Google's Rich Results Test.
- **Titles and headings** lead with "Luna Dine" (home: "Luna Dine — Exotic Multicuisine Restaurant, Salkia, Howrah"; menu: "Luna Dine Menu & Prices — Salkia, Howrah"). Both H1s carry the name in an `sr-only` span ("Luna Dine: Beyond fine dining", "Luna Dine Menu"), so nothing changes on screen. Headings split into lines keep a `{" "}` between the line spans, or crawlers read "Beyondfine dining".
- **Canonical URLs** on both pages, `lang="en-IN"`, `og:*`/Twitter cards, `application-name`, `robots: max-image-preview:large`, `sitemap.xml` and `robots.txt` (`app/sitemap.ts`, `app/robots.ts`). `/review` is `noindex`.
- **Favicon**: `assets/img/favicon.svg` must stay square (Google shows only square favicons in results); `public/favicon.ico` (16/32/48) is for crawlers and tools that look for it by that fixed path.
- **Ownership checks**: paste the Google Search Console / Bing Webmaster Tools HTML-tag codes into `SITE.verify` in `lib/site.ts`; the tags render only when set.
- **IndexNow** (tells Bing, which also supplies other engines such as Yandex, about new or changed pages at once): the key file is `public/68ae306f06597df6218204cfd590f250.txt` (its name and its content are the key). After a deploy that changes content, run:
  `curl -sS -X POST https://api.indexnow.org/indexnow -H "Content-Type: application/json" -d '{"host":"luna-dine.vercel.app","key":"68ae306f06597df6218204cfd590f250","keyLocation":"https://luna-dine.vercel.app/68ae306f06597df6218204cfd590f250.txt","urlList":["https://luna-dine.vercel.app/","https://luna-dine.vercel.app/menu"]}'`

What the owner has to do (none of it is code, and it matters more than anything above):
1. **Google Search Console**: add a *URL-prefix* property for `https://luna-dine.vercel.app/` (a Domain property can't work on vercel.app), verify with the HTML tag (code into `SITE.verify.google`, redeploy), submit `sitemap.xml`, then URL Inspection → Request indexing for `/` and `/menu`.
2. **Bing Webmaster Tools**: import the site from Search Console (or verify with `SITE.verify.bing`). Bing's index also feeds other search tools, including DuckDuckGo and many AI assistants.
3. **Google Business Profile**: claim the Maps listing (`PLACE_ID` in `lib/site.ts`) and set its website to the site and its menu link to `/menu`; keep name, address, phone and hours exactly as on the site. This is what shows the business panel for "Luna Dine" searches.
4. **Links in**: the website in the Instagram and Facebook bios, and in any Zomato / Swiggy / Justdial / magicpin listing, with the same name, address and phone. Set the GitHub repo's Website field to the site.
5. **A custom domain** (e.g. lunadine.in): the strongest long-term step for a one-word "lunadine" search, and it avoids Google labelling results with the host's name ("Vercel"), which happens to vercel.app sites. Then change `PROD_URL`, redirect the vercel.app address to the new domain, use Search Console's change of address, rerun `qr-maker.py` and reprint the QR codes.

## Gotchas (read before editing)
1. **Never toggle classes with `classList` on an element whose `className` React controls.** The next re-render wipes them. That's why the active chip (`on`), the thumb's `has-thumb` and the review flags are React state in `MenuBrowser`. Inline styles and data attributes React doesn't render are fine. `PageFX` only touches server-rendered markup.
2. **Global state lives as classes on `<html>`**: `no-intro`, `menu-open` (home phone sheet), `nav-solid`/`nav-gone` (home nav), `diet-v`/`diet-n` (menu filter). Set them only via `document.documentElement`.
3. **Scrolling**: Lenis drives native window scroll, so `scrollY` and `scroll` events stay accurate. Scroll in code with `lib/scroll.ts` (`scrollToY`, `jumpToY`, `scrollToId`); they handle Lenis being `null` (reduced motion) or stopped. After content height changes, call `window.LD?.lenis?.resize()`.
4. **No `#hash` links, anywhere.** In-page navigation uses `ScrollTo` buttons or `scrollToId()`, and the URL never changes.
5. **Respect `prefers-reduced-motion`** everywhere: there's a global CSS override, and JS checks `reducedMotion()`.
6. **Hover effects go inside `@media (hover:hover)`.** On phones a tap triggers `:hover` and leaves it stuck. Touch gets a short `:active` press-in instead, and the tap highlight is off.
7. **`backdrop-filter`: write `-webkit-backdrop-filter` first, then `backdrop-filter`.** The build's CSS minifier keeps only the last of the pair; with the standard one first, Chrome, Edge and Android got no blur.
8. **"Step inside" (The Room portal):** `.portal` is 260svh tall (230 on portrait) with a sticky 100svh stage. `PageFX` measures, on resize only, the frame between the words (`.portal__gap`) and each arch's final box, then on scroll maps each arch from the frame to its box with `translate3d` + `scale` (transform and opacity only; 60fps at 4× CPU slowdown). Landscape shows three arches; portrait/≤700px only the middle one. Under reduced motion it isn't pinned. If you change the stage's layout, keep the arches' final boxes in CSS so the measurement stays right.
9. **"The Room" gallery** is a pure-CSS reel: cards rendered twice, the track animates to `-50%`; each card carries its own right margin (not `gap`) so the halves are equal and the loop is seamless. Pauses on hover; under reduced motion it stops and becomes swipeable.
10. **The starfield** must never run more than one rAF loop (`start()` in `Sky`): a frame queued while the tab was hidden runs when it's shown again.
11. **Never reference an asset by a fixed path** (`/img/…`, `/video/…`) or put one in `public/`: import it from `assets/` so its URL is fingerprinted (see Stack).

## Design system
- **Colours:** night `#080d1b`, navy `#1b2540` (brand), cream `#f4ecda`, paper `#efe5cd` (+ `assets/img/paper.webp` multiplied, `--paper-bg`), gold `#f3c37c` (from the illuminated signage), ember `#d4694e`. Veg/non-veg marks use the Indian standard green dot / red triangle (`.vg`, `.vg.n`, the `Veg` component).
- **Motifs:** arches (`border-radius:999px 999px …`, echoing the restaurant's lit Pichwai arches), the moon, stars, and the deer emblem. Dark night sections alternate with cream "menu card" paper sections.
- **Motion:** easing `cubic-bezier(.22,1,.36,1)`, ~1.1 s reveals (24px rise), nothing bouncy, except the menu's diet-filter switch (a small overshoot, at the owner's request). Hovers are quick colour changes (~.2 s), never layout properties like padding. The only loops are the marquee and The Room reel. The hero moon rises once from behind the arch after the intro, then stays still, as does the map pin. **Signature dishes:** the cards are dealt onto the table as the grid scrolls in (each flips up from `rotateX(-72deg)`, staggered by column). A card is *lit* on hover or, on touch screens, while it passes the middle of the screen: night rises from the bottom as an arch (`.dish::before` clip-path, grown past the card so its curve clears the corners), a moon rises into the empty corner with a few stars (`.dish__sky`), and the name lights up letter by letter with a small lift (`.dl` spans with `--i`; an sr-only copy keeps the name readable), the price turning gold. The delays are only on the way in, so leaving is instant. Under "the detour" a winding road draws itself left to right (a sweeping `clip-path` on `.detour__road`, not a dash offset, which flashes at the far end first) and ends at a small moon.
- **Restraint:** no glows (coloured `box-shadow`/`drop-shadow`) or gold radial washes, except the moons' own light; depth comes from hairlines and neutral shadows. Labels are sentence case at normal tracking, never spaced-out uppercase. Gold italic is for one word in a display headline only. Headlines have no trailing period. Spacing is on a 4px grid.
- **Ember on paper:** `--ember` for display sizes (headline words, prices); `--ember-ink` for small text such as section labels, since plain ember is only 2.8:1 on paper.
- **Logo:** `components/Brand.tsx` holds paths vector-traced from the printed menu, using `currentColor`. Don't redraw or restyle the mark.

## Review mode (menu issues)
`lib/menu-issues.ts` lists open questions about menu names and prices. On `/menu`, a floating **Menu issues** button (bottom right) opens that list, and flagged dishes get a red **?** and a wavy underline; "Show" switches to All and jumps to the dish. It only shows when the hostname isn't the production host (`prodHost`, from `SITE.url` on the server: so localhost and preview deploys), or when the URL has `?review`, and only while the list has entries. Customers on the real domain never see it. When the owner answers a question, update `lib/menu.ts` and delete the entry.

## Kitchen promise
Owner-supplied claims, rendered by `KitchenPromise` in the menu header and beside the Signatures headline: No Ajinomoto, no trans fat, no food colour, and a separate chef and utensils for the vegetarian menu. Don't extend or reword them as stronger claims without the owner.

## Content rules
- **Don't invent facts.** **Hours (from the owner): every day, 11 am – 12 am (midnight).** They're in the Visit section ("Daily, 11 am – midnight") and the JSON-LD; change both together. Don't add ratings, reviews, awards, chef names, or "since" claims unless the owner provides them.
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
