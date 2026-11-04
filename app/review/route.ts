import { SITE } from "@/lib/site";
import favicon from "@/assets/img/favicon.svg";

/* /review: what the review QR codes open. A tiny static page (no React, no bundles) rather than a server redirect,
   because of what happens when Google's link opens the Google Maps app instead of a web page:
   - with a plain redirect, the browser tab is left sitting on /review; when the browser later reloads its
     background tabs, /review redirects again and the Maps app pops up out of nowhere;
   - here, before leaving, the page rewrites its own address to the home page (history.replaceState), so the tab
     left behind is the home page, and if the reader comes back to it, it loads the home page for real.
   When the link opens in the browser instead, it replaces this page in the same tab (location.replace), so Back
   goes to wherever the reader was before, not back here to be bounced again.
   The target is SITE.review in lib/site.ts; the fallback button (shown only if the redirect doesn't happen) uses
   SITE.reviewWeb, the browser review box, so there's always a way in. Built once at build time (force-static). */
export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function GET() {
  const url = SITE.review;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#080d1b">
<title>Review Luna Dine</title>
<link rel="icon" href="${favicon.src}">
<script>
(function () {
  var to = ${JSON.stringify(url)}, left = false;
  // the tab left behind (if Google's link opens the Maps app) is the home page, not this redirect
  try { history.replaceState(null, "", "/"); } catch (e) {}
  // back from the Maps app, or restored from the back/forward cache: show the home page, don't redirect again
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") left = true;
    else if (left) location.replace("/");
  });
  addEventListener("pageshow", function (e) { if (e.persisted) location.replace("/"); });
  location.replace(to);
})();
</script>
<style>
html,body{margin:0;height:100%;background:#080d1b;color:#f4ecda;font:16px/1.5 ui-sans-serif,system-ui,sans-serif}
main{min-height:100%;display:grid;place-content:center;gap:16px;padding:24px;text-align:center}
h1{margin:0;font:400 32px/1.1 ui-serif,Georgia,serif}
p{margin:0;color:rgba(244,236,218,.66)}
a{color:inherit}
.btn{justify-self:center;margin-top:8px;padding:12px 24px;border-radius:999px;background:#f3c37c;color:#080d1b;font-weight:500;text-decoration:none}
</style>
</head>
<body>
<main>
<h1>Taking you to Google reviews</h1>
<p>Thank you for dining with us at Luna Dine</p>
<a class="btn" href="${esc(SITE.reviewWeb)}">Leave a review</a>
<p><a href="/">Back to Luna Dine</a></p>
</main>
</body>
</html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
