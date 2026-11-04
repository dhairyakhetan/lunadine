#!/usr/bin/env python3
"""
Luna Dine QR codes. Writes, next to this file:
  luna-menu.png    plain QR for <site>/menu, with the Luna emblem in the middle
  luna-review.png  desk sticker, "Leave us your review on Google", for <site>/review
                   (/review sends people on to SITE.review in lib/site.ts, so the Google link can change without reprinting)

Setup, once:   pip install segno playwright   and   playwright install chromium
Run:           python qr/qr-maker.py
Optional:      pip install zxing-cpp pillow   so the script also checks that both images decode.

<site> is PROD_URL in lib/site.ts, brand artwork comes from components/Brand.tsx and fonts from assets/fonts/, so the
codes always match the site. If the domain changes, run this again and reprint.
Error level H. The finder "eyes" are only softly rounded (outer radius 0.9 module) and the logo cut-out is 9x9
modules: stronger rounding or a bigger cut-out stopped strict decoders reading the code.
"""
import re, sys, pathlib
import segno
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent
SITE_URL = re.search(r'PROD_URL = "([^"]+)"', (REPO / "lib/site.ts").read_text()).group(1)
URLS = {"menu": f"{SITE_URL}/menu", "review": f"{SITE_URL}/review"}

def url(p): return (REPO / p).as_uri()

# --- brand paths (emblem + wordmark) from the site's own logo file
_brand = (REPO / "components/Brand.tsx").read_text()
def brand(key):
    return (re.search(rf'{key}_D = "([^"]+)"', _brand).group(1), re.search(rf'{key}_VB = "([^"]+)"', _brand).group(1))
EMBLEM_D, EMBLEM_VB = brand("EMBLEM")
WORDMARK_D, WORDMARK_VB = brand("WORDMARK")

# --- the QR itself, as SVG in module units
def qr_svg(matrix, fg="#1b2540", dot="square", qz=4, ko=9):
    n = len(matrix)
    k0, k1 = (n - ko) // 2, (n - ko) // 2 + ko
    finder = lambda x, y: (x < 7 and y < 7) or (x >= n - 7 and y < 7) or (x < 7 and y >= n - 7)
    mods = []
    for y, row in enumerate(matrix):
        for x, on in enumerate(row):
            if not on or finder(x, y) or (k0 <= x < k1 and k0 <= y < k1):
                continue
            if dot == "soft":
                mods.append(f'<rect x="{x + .06}" y="{y + .06}" width=".88" height=".88" rx=".3"/>')
            else:
                mods.append(f'<rect x="{x}" y="{y}" width="1.02" height="1.02"/>')
    def rr(x, y, w, r):  # rounded square path
        return (f"M{x + r} {y}h{w - 2 * r}a{r} {r} 0 0 1 {r} {r}v{w - 2 * r}a{r} {r} 0 0 1 -{r} {r}"
                f"h-{w - 2 * r}a{r} {r} 0 0 1 -{r} -{r}v-{w - 2 * r}a{r} {r} 0 0 1 {r} -{r}z")
    eyes = "".join(
        f'<path fill="{fg}" fill-rule="evenodd" d="{rr(x, y, 7, .9)} {rr(x + 1, y + 1, 5, .5)}"/>'
        f'<path fill="{fg}" d="{rr(x + 2, y + 2, 3, .5)}"/>'
        for x, y in ((0, 0), (n - 7, 0), (0, n - 7)))
    c, r = n / 2, ko / 2 - .35
    ew = r * 1.18; eh = ew * 430 / 335
    badge = (f'<circle cx="{c}" cy="{c}" r="{r}" fill="#1b2540"/>'
             f'<circle cx="{c}" cy="{c}" r="{r - .45}" fill="none" stroke="#f3c37c" stroke-width=".18"/>'
             f'<svg x="{c - ew / 2}" y="{c - eh / 2 - .1}" width="{ew}" height="{eh}" viewBox="{EMBLEM_VB}">'
             f'<path fill="#f3c37c" fill-rule="evenodd" d="{EMBLEM_D}"/></svg>')
    return (f'<svg class="qr" viewBox="{-qz} {-qz} {n + qz * 2} {n + qz * 2}" shape-rendering="geometricPrecision">'
            f'<g fill="{fg}">{"".join(mods)}</g>{eyes}{badge}</svg>')

def matrix(u):
    q = segno.make(u, error="h", micro=False, boost_error=False)
    return [[1 if v else 0 for v in row] for row in q.matrix]

GOOGLE_G = ('<svg viewBox="0 0 48 48" width="74" height="74">'
    '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>'
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>'
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>'
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>')
STAR = '<svg viewBox="0 0 24 24" width="34" height="34"><path fill="#f3c37c" d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8z"/></svg>'

def wave(w=1000, y=330, amp=34, fill="#1b2540", stroke="#f3c37c"):
    d = (f"C{w * .78} {y + amp * 1.8} {w * .55} {y - amp * 1.2} {w * .36} {y + amp * .4}"
         f"S{w * .08} {y + amp * 1.6} 0 {y + amp * .5}")
    return (f'<svg class="wave" viewBox="0 0 {w} {y + amp * 2}" preserveAspectRatio="none">'
            f'<path d="M0 0H{w}V{y}{d}Z" fill="{fill}"/><path d="M{w} {y}{d}" fill="none" stroke="{stroke}" stroke-width="5"/></svg>')

BASE = f"""
@font-face{{font-family:LDSans;src:url({url('assets/fonts/outfit-latin-wght-normal.woff2')});font-weight:100 900}}
*{{box-sizing:border-box;margin:0}}
html,body{{overflow:hidden;background:transparent}}
body{{position:relative;font-family:LDSans}}
.qr{{display:block;width:100%;height:auto}}
"""

def sticker(m):
    return 1000, 1200, f"""
<style>
.plate{{position:absolute;inset:14px;border-radius:64px;overflow:hidden;background:#f7f1e3;box-shadow:0 0 0 2px rgba(201,154,79,.8),0 30px 60px -20px rgba(0,0,0,.35)}}
.plate::after{{content:"";position:absolute;inset:0;border-radius:64px;pointer-events:none;background:linear-gradient(155deg,rgba(255,255,255,.35),rgba(255,255,255,0) 38%,rgba(255,255,255,0) 70%,rgba(255,255,255,.12))}}
.band{{position:absolute;left:0;right:0;top:0;height:420px}}
.wave{{position:absolute;left:0;top:0;width:100%;height:100%}}
.head{{position:absolute;left:0;right:0;top:56px;display:flex;flex-direction:column;align-items:center;gap:18px;color:#f4ecda}}
.g{{width:118px;height:118px;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 6px 20px rgba(0,0,0,.18)}}
.lbl{{font-size:30px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;text-align:center;line-height:1.25}}
.stars{{display:flex;gap:8px}}
.box{{position:absolute;left:50%;top:430px;width:560px;margin-left:-280px}}
.foot{{position:absolute;left:0;right:0;bottom:46px;display:flex;flex-direction:column;align-items:center;gap:10px;color:#1b2540}}
.foot .wm{{width:200px;height:auto}}
.foot small{{font-size:18px;font-weight:500;letter-spacing:.3em;text-transform:uppercase;opacity:.62}}
</style>
<div class="plate">
  <div class="band">{wave()}</div>
  <div class="head"><span class="g">{GOOGLE_G}</span><span class="lbl">Leave us your review<br>on Google</span><span class="stars">{STAR * 5}</span></div>
  <div class="box">{qr_svg(m, dot="soft", qz=1.5)}</div>
  <div class="foot"><svg class="wm" viewBox="{WORDMARK_VB}"><path fill="currentColor" fill-rule="evenodd" d="{WORDMARK_D}"/></svg><small>Scan · Rate · Review</small></div>
</div>"""

def plain(m):
    return 1000, 1000, f'<style>body{{background:#fff}}.box{{position:absolute;inset:0}}</style><div class="box">{qr_svg(m)}</div>'

DESIGNS = {"luna-menu": ("menu", plain, False), "luna-review": ("review", sticker, True)}

def launch(p):
    try:
        return p.chromium.launch()
    except Exception:
        for c in sorted(pathlib.Path("/opt/pw-browsers").glob("chromium-*/chrome-linux*/chrome")):  # preinstalled browser, if any
            return p.chromium.launch(executable_path=str(c))
        raise

def check(name, u):
    try:
        import zxingcpp
        from PIL import Image
    except ImportError:
        return
    im = Image.open(HERE / f"{name}.png").convert("RGBA")
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im); im = bg.convert("RGB")
    ok = all(any(r.text == u for r in zxingcpp.read_barcodes(im.resize((w, round(im.height * w / im.width)))))
             for w in (1000, 600, 360))
    print(f"  {name}: {'decodes OK' if ok else 'DOES NOT DECODE, do not print'}")
    if not ok:
        sys.exit(1)

def main():
    with sync_playwright() as p:
        b = launch(p)
        for name, (key, design, transparent) in DESIGNS.items():
            w, h, html = design(matrix(URLS[key]))
            page = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=2)
            tmp = HERE / f".{name}.html"
            tmp.write_text(f'<!doctype html><html><head><meta charset="utf-8"><style>{BASE}html,body{{width:{w}px;height:{h}px}}</style></head><body>{html}</body></html>')
            page.goto(tmp.as_uri()); page.evaluate("document.fonts.ready"); page.wait_for_timeout(200)
            page.screenshot(path=str(HERE / f"{name}.png"), omit_background=transparent)
            tmp.unlink(); page.close()
            print(f"wrote qr/{name}.png  →  {URLS[key]}")
        b.close()
    for name, (key, _, _) in DESIGNS.items():
        check(name, URLS[key])

if __name__ == "__main__":
    main()
