# Luna Dine — website

**Live site: [luna-dine.vercel.app](https://luna-dine.vercel.app)** · [Menu](https://luna-dine.vercel.app/menu) · Luna Dine, an exotic multicuisine restaurant at 140/2 Salkia School Road, Howrah.

Next.js 16 (App Router) site for Luna Dine, Salkia, Howrah. Both pages are statically pre-rendered. `CLAUDE.md` has the full code map, what has to change together, and the content rules.

## Run / deploy
```bash
npm install
npm run dev     # local dev at http://localhost:3000
npm run build   # production build
```
**Vercel:** import the folder or repo. The framework is detected as Next.js automatically, and no settings or environment variables are needed.

## Where things are
| What | File |
|---|---|
| Menu items and prices (the menu page and dish counts update from this) | `lib/menu.ts` |
| Phone, address, socials, map, site URL, review link | `lib/site.ts` |
| Home page (hero, story, room gallery, signature dishes, visit) | `app/page.tsx`, effects in `components/PageFX.tsx` |
| Menu page (the QR menu: All / Veg / Non-veg filter, section chips, sections) | `app/menu/page.tsx`, `components/MenuBrowser.tsx` |
| Smooth scroll, starfield, nav, shared bits | `components/SmoothScroll.tsx`, `Sky.tsx`, `Nav.tsx`, `Chrome.tsx`, `lib/scroll.ts` |
| Styles | `app/globals.css` |
| Logo SVG paths (traced from the printed menu) | `components/Brand.tsx` |
| Printable QR codes (menu, Google review sticker) | `qr/` |
| Photos, video, icons, share images, fonts (imported, so their URLs change with their content) | `assets/` |
| The printed PDF menu (fixed address) | `public/` |

## Handoff notes
- **QR menu:** `/menu` is the page the table QR codes open. It's only the menu, with an All / Veg / Non-veg filter and no site nav or search.
- **Review QR:** `/review` (`app/review/route.ts`) sends people on to `SITE.review` in `lib/site.ts`, so the Google review link can change without reprinting.
- **Opening hours:** daily, 11 am – midnight (from the owner), shown in the Visit section and in Google's structured data.
- **Menu issues / review mode:** open `/menu?review` (or any preview deploy) to see the **Menu issues** button and flagged dishes. The list lives in `lib/menu-issues.ts`; it's empty now, and the button only shows while it has entries.
- **Live address:** `https://luna-dine.vercel.app`, set in `lib/site.ts`. Share previews, the sitemap, Google's restaurant details and the QR codes use it. If the domain changes, update it there, redeploy, and remake the QR codes (`python qr/qr-maker.py`).
