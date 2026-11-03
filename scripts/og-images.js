// Renders the Open Graph images (public/img/og-home.jpg, og-menu.jpg) from the brand SVGs, fonts and photos.
// Needs Playwright with Chromium, which is NOT a project dependency. Run it from a machine that has it:
//   npx -y playwright@1 install chromium   (once)
//   NODE_PATH=$(npm root -g) node scripts/og-images.js
// If prices of the dishes shown on the menu card change in lib/menu.ts, update `rows` below and re-run.
// Rename the output files when you change them: /img/* is cached for a year, and so are social previews.
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const repo = path.join(__dirname, '..');
const out = path.join(repo, 'public/img');
const brandSrc = fs.readFileSync(path.join(repo, 'components/Brand.tsx'), 'utf8');
const B = Object.fromEntries(['EMBLEM', 'WORDMARK', 'TAGLINE', 'ORNAMENT'].flatMap(k => ['D', 'VB'].map(x => [`${k}_${x}`, brandSrc.match(new RegExp(`${k}_${x} = "([^"]+)"`))[1]])));
const f = p => 'file://' + path.join(repo, p);

const svg = (vb, d, cls) => `<svg class="${cls}" viewBox="${vb}"><path fill="currentColor" fill-rule="evenodd" d="${d}"/></svg>`;
const emblem = c => svg(B.EMBLEM_VB, B.EMBLEM_D, c);
const wordmark = c => svg(B.WORDMARK_VB, B.WORDMARK_D, c);
const tagline = c => svg(B.TAGLINE_VB, B.TAGLINE_D, c);
const ornament = c => svg(B.ORNAMENT_VB, B.ORNAMENT_D, c);

// deterministic starfield
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const stars = Array.from({ length: 140 }, () => {
  const s = rnd() < .9 ? 1 + rnd() * 1.3 : 2.2 + rnd() * 1.4;
  return `<i style="left:${(rnd() * 100).toFixed(2)}%;top:${(rnd() * 100).toFixed(2)}%;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;opacity:${(.25 + rnd() * .65).toFixed(2)}"></i>`;
}).join('');

const base = `
@font-face{font-family:LDSerif;src:url(${f('app/instrument-serif-latin-400-normal.woff2')})}
@font-face{font-family:LDSerif;font-style:italic;src:url(${f('app/instrument-serif-latin-400-italic.woff2')})}
@font-face{font-family:LDSans;src:url(${f('app/outfit-latin-wght-normal.woff2')});font-weight:100 900}
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden}
body{position:relative;font-family:LDSans;color:#f4ecda;
  background:radial-gradient(70% 90% at 78% 20%,rgba(243,195,124,.16),transparent 60%),
             radial-gradient(90% 120% at 10% 110%,#1b2540 0%,transparent 60%),#080d1b}
.stars i{position:absolute;border-radius:50%;background:#fff;box-shadow:0 0 6px rgba(255,255,255,.6)}
.moon{position:absolute;border-radius:50%;
  background:radial-gradient(circle at 38% 35%,#fff8e6 0%,#f6dfae 45%,#e9c27f 75%,#d9a95e 100%);
  box-shadow:0 0 60px 18px rgba(243,195,124,.35),0 0 160px 60px rgba(243,195,124,.14)}
.moon::after{content:"";position:absolute;inset:0;border-radius:50%;
  background:radial-gradient(circle at 30% 60%,rgba(170,120,60,.10) 0 7%,transparent 13%),radial-gradient(circle at 62% 30%,rgba(170,120,60,.08) 0 5%,transparent 10%),radial-gradient(circle at 58% 70%,rgba(170,120,60,.08) 0 9%,transparent 16%)}
.arch{position:absolute;bottom:-2px;border-radius:999px 999px 0 0;overflow:hidden;
  box-shadow:0 0 0 7px #d59a3c,0 0 0 8px rgba(0,0,0,.35),0 0 70px 10px rgba(243,195,124,.35)}
.arch img{width:100%;height:100%;object-fit:cover;display:block}
.ring{position:absolute;bottom:-2px;border-radius:999px 999px 0 0;border:1.5px solid rgba(243,195,124,.55);border-bottom:0}
.kicker{font-size:15px;font-weight:500;letter-spacing:.34em;text-transform:uppercase;color:#f3c37c;display:flex;align-items:center;gap:14px}
.kicker::before{content:"";width:34px;height:1px;background:currentColor}
`;

const home = `<!doctype html><html><head><meta charset="utf-8"><style>${base}
.copy{position:absolute;left:86px;top:0;bottom:0;width:610px;display:flex;flex-direction:column;justify-content:center}
.emb{width:112px;height:auto;color:#f3c37c;filter:drop-shadow(0 0 22px rgba(243,195,124,.35));margin-bottom:26px}
.wm{width:470px;height:auto;color:#f4ecda;display:block}
.tag{width:330px;height:auto;color:#f3c37c;margin:20px 0 0 2px}
.rule{width:470px;height:1px;margin:30px 0 24px;background:linear-gradient(90deg,rgba(243,195,124,.7),rgba(243,195,124,0))}
.cuisines{font-family:LDSerif;font-style:italic;font-size:34px;line-height:1.15;color:#f4ecda}
.cuisines b{font-weight:400;color:#f3c37c;font-style:normal;padding:0 6px}
.where{margin-top:16px;font-size:16px;letter-spacing:.24em;text-transform:uppercase;color:rgba(244,236,218,.66)}
</style></head><body>
<div class="stars">${stars}</div>
<div class="moon" style="width:130px;height:130px;right:356px;top:52px"></div>
<div class="ring" style="right:52px;width:388px;height:574px"></div>
<div class="arch" style="right:76px;width:340px;height:540px"><img src="${f('public/img/arches.webp')}" style="object-position:28% 40%"></div>
<div class="copy">
  ${emblem('emb')}
  ${wordmark('wm')}
  ${tagline('tag')}
  <div class="rule"></div>
  <div class="cuisines">Chinese<b>·</b>Tandoor<b>·</b>Bengali<b>·</b>Thai<b>·</b>Korean</div>
  <div class="where">Exotic multicuisine · Salkia, Howrah</div>
</div>
</body></html>`;

const rows = [['Drums of Heaven', '6 pc', '₹280'], ['Chicken Afghani — Full', '', '₹540'], ['Korean Kimchi Fried Rice', '', '₹250'], ['Mutton Biryani Special', '', '₹400'], ['Kiwi Mojito', '', '₹185']];
const vg = n => `<i class="vg${n ? ' n' : ''}"></i>`;
const diet = [1, 1, 0, 1, null];
const menu = `<!doctype html><html><head><meta charset="utf-8"><style>${base}
.copy{position:absolute;left:84px;top:0;bottom:0;width:520px;display:flex;flex-direction:column;justify-content:center}
.brand{display:flex;align-items:center;gap:18px;margin-bottom:30px}
.brand .emb{width:62px;height:auto;color:#f3c37c}
.brand .wm{width:210px;height:auto;color:#f4ecda}
h1{font-family:LDSerif;font-weight:400;font-size:132px;line-height:.9;letter-spacing:-.01em;margin-top:18px}
h1 em{color:#f3c37c}
.count{margin-top:22px;font-size:21px;color:rgba(244,236,218,.75);line-height:1.45}
.promise{display:flex;flex-wrap:wrap;gap:9px;margin-top:28px}
.promise span{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:999px;border:1px solid rgba(243,195,124,.4);background:rgba(243,195,124,.08);font-size:15.5px}
.promise span::before{content:"✓";color:#f3c37c;font-weight:600}
.promise .veg{border-color:rgba(79,170,96,.55);background:rgba(79,170,96,.12)}
.promise .veg::before{content:"●";color:#6cc47e;font-size:11px}
.card{position:absolute;right:70px;top:58px;bottom:-30px;width:470px;border-radius:240px 240px 0 0;padding:120px 46px 0;
  background:#efe5cd url(${f('public/img/paper.webp')});background-size:500px;background-blend-mode:multiply;color:#1b2540;
  box-shadow:0 0 0 6px rgba(243,195,124,.9),0 0 0 7px rgba(0,0,0,.3),0 0 80px 10px rgba(243,195,124,.25)}
.card .orn{width:150px;height:auto;display:block;margin:0 auto 8px;color:#1b2540;opacity:.75}
.card small{display:block;text-align:center;font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:#d4694e}
.card h2{font-family:LDSerif;font-weight:400;font-size:46px;text-align:center;margin:6px 0 22px}
.card li{list-style:none;display:flex;align-items:baseline;gap:10px;padding:10px 0;font-size:18px}
.card ul{padding:0}
.card .dt{flex:1;border-bottom:1.5px dotted rgba(27,37,64,.35);transform:translateY(-5px)}
.card .nt{font-size:13px;color:rgba(27,37,64,.55)}
.card .pr{font-family:LDSerif;font-size:25px;line-height:1}
.vg{display:inline-grid;place-items:center;width:14px;height:14px;border:1.6px solid #1f8a3b;border-radius:2px;flex:none;align-self:center}
.vg::after{content:"";width:6px;height:6px;border-radius:50%;background:#1f8a3b}
.vg.n{border-color:#b3261e}.vg.n::after{width:0;height:0;border-radius:0;background:none;border-left:3.5px solid transparent;border-right:3.5px solid transparent;border-bottom:6px solid #b3261e}
.nov{width:14px;flex:none}
</style></head><body>
<div class="stars">${stars}</div>
<div class="moon" style="width:96px;height:96px;left:560px;top:44px"></div>
<div class="card">
  ${ornament('orn')}
  <small>A few favourites</small>
  <h2>From the kitchen</h2>
  <ul>${rows.map(([n, nt, p], i) => `<li>${diet[i] === null ? '<span class="nov"></span>' : vg(diet[i])}<span>${n}</span>${nt ? `<span class="nt">${nt}</span>` : ''}<span class="dt"></span><span class="pr">${p}</span></li>`).join('')}</ul>
</div>
<div class="copy">
  <div class="brand">${emblem('emb')}${wordmark('wm')}</div>
  <div class="kicker">Menu card</div>
  <h1>The <em>menu.</em></h1>
  <div class="count">Chinese, tandoor, Bengali, Thai &amp; Korean —<br>every dish, every price.</div>
  <div class="promise"><span>No Ajinomoto</span><span>No trans fat</span><span>No food colour</span><span class="veg">Separate veg chef &amp; utensils</span></div>
</div>
</body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const [name, html] of [['og-home', home], ['og-menu', menu]]) {
    const file = path.join(os.tmpdir(), name + '.html');
    fs.writeFileSync(file, html);
    await p.goto('file://' + file, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(out, name + '.jpg'), type: 'jpeg', quality: 86 });
  }
  await b.close();
})();
