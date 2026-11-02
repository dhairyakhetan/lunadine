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
| Phone, address, socials, map, **site URL** (set the real domain after launch) | `lib/site.ts` |
| Home page (hero, story, room gallery, signature dishes, visit) | `app/page.tsx` |
| Menu page; search, filter and scrollspy | `app/menu/page.tsx`, `components/MenuBrowser.tsx` |
| Scroll effects / smooth scroll / starfield / nav | `components/PageFX.tsx`, `SmoothScroll.tsx`, `Sky.tsx`, `Nav.tsx` |
| Styles | `app/globals.css` |
| Logo SVG paths (traced from the printed menu) | `components/Brand.tsx` |
| Photos, video, PDF menu | `public/` |

## Handoff notes
- **Not tested since the last edit.** A successful `next build` and a browser check (desktop + mobile, client-side navigation, search) passed *before* one final change. That change is in `MenuBrowser.tsx`: after a search or filter while the toolbar is pinned, the page jumps so the results start under the toolbar. Run `npm run build` and test it once.
- **Leftover files:** `index.html`, `menu.html` and `assets/` in this folder are from the old static version. They are listed in `.vercelignore` so they don't deploy, but they can be deleted.
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
- `SITE.url` in `lib/site.ts` is a placeholder (`lunadine.vercel.app`). It's used for the sitemap, Open Graph and structured data.
