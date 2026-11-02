You're picking up the Luna Dine restaurant website, a Next.js 16 project in this folder. Read `CLAUDE.md` first; it explains the architecture, gotchas, and content rules.

Get it production-ready and deployed on Vercel:

1. **Clean up.** Delete the leftover static-site files at the project root: `index.html`, `menu.html`, and the `assets/` folder. Don't touch `app/`, `components/`, `lib/`, or `public/`. Then remove those three entries from `.vercelignore`, or delete the file if nothing is left in it.
2. **Install and build.** Run `npm install`, then `npm run build`. It must finish with no TypeScript errors, and every route (`/`, `/menu`, `/robots.txt`, `/sitemap.xml`) must be static (`○`). Fix anything that fails.
3. **Verify in a browser** with `npm run start`, at 1440×900 and 390×844:
   - **Home:** the intro plays on first load. The hero video autoplays. The story text lights up word by word on scroll. "The Room" gallery scrolls sideways on desktop and swipes on mobile.
   - **Menu:** search "mojito" while scrolled partway down. The results must appear right under the sticky search bar, not off-screen above it. This was the last change and is untested. The Veg / Non-veg filter works, and the category chips follow the scroll.
   - **Navigation:** go from home to menu, then from menu back to home using the "Visit" link. It should land on the Visit section, and the intro must not replay.
   - **Mobile:** the burger menu opens and closes, and the bottom Call / Menu / Directions bar appears after scrolling.
   - The console shows no errors and no hydration warnings.
4. **Set up git and deploy.**
   - Initialise a git repo if there isn't one and commit.
   - Deploy to Vercel with the Vercel CLI or the Vercel integration, as a new project named `luna-dine`. No environment variables are needed.
   - Once it's live, set `url` in `lib/site.ts` to the production URL, commit, and redeploy. Open Graph, the sitemap and structured data depend on it.
5. **Report back** with the live URL, anything you fixed, and anything you couldn't verify.

**Constraints:**
- Don't add dependencies, Tailwind, or analytics without asking.
- Don't invent opening hours, reviews, or any other facts.
- Don't change the menu names listed as "waiting on the owner" in `CLAUDE.md`.
- Keep both pages statically rendered and the site fast.
