# Luna Dine — website

Next.js 16 (App Router) site for Luna Dine, Salkia, Howrah. Both pages are statically pre-rendered.

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
| Phone, address, socials, map, site URL (automatic on Vercel) | `lib/site.ts` |
| Home page (hero, story, room gallery, signature dishes, visit) | `app/page.tsx` |
| Menu page (the QR menu: section chips + sections only) | `app/menu/page.tsx`, `components/MenuBrowser.tsx` |
| Scroll effects / smooth scroll / starfield / nav | `components/PageFX.tsx`, `SmoothScroll.tsx`, `Sky.tsx`, `Nav.tsx` |
| Styles | `app/globals.css` |
| Logo SVG paths (traced from the printed menu) | `components/Brand.tsx` |
| Photos, video, PDF menu | `public/` |

## Handoff notes
- **QR menu:** `/menu` is the page the table QR codes open. It's only the menu, with no nav, search or filters.
- **Menu issues / review mode:** open `/menu?review` (or any preview deploy) to see the **Menu issues** button and the flagged dishes. The list lives in `lib/menu-issues.ts`.
- **Opening hours:** unknown, so the site doesn't show any.
- **Menu questions still waiting on the owner** (the items are left as printed until answered):
  - "Continuos" noodles. Is it "Continental"?
  - "Salanta" / "Salanto" gravies: what is the correct name?
  - "Moon Fan" fried rice.
  - "Royal Hummer".
  - "Burnt Garlic" (the site adds "Noodles").
  - "Dewani" vs "Diwani" Handi.
  - The non-veg Chinese gravy section had 3 rows printed twice.
  - Prices to confirm: Egg Fried Rice ₹250 vs Egg Schezwan ₹240; Cucumber Salad ₹150.
- `SITE.url` in `lib/site.ts` is set automatically on Vercel from the production domain (`VERCEL_PROJECT_PRODUCTION_URL`). If you add a custom domain, make it the production domain in Vercel and redeploy, and share previews will follow.
