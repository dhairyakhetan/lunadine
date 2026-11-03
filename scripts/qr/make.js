// Luna Dine QR designs → qr-codes/. Run: node scripts/qr/make.js . qr-codes  (needs Playwright + Chromium, not a project dependency).
// matrix.json is the QR for https://luna-dine.vercel.app/menu at error level H (version 4, 33×33), made with Python segno:
//   segno.make(URL, error="h", boost_error=False).matrix  — regenerate it if the URL changes, then re-run this.
// Keep finder-eye radii small (outer <= ~1.2 modules) and the logo knock-out at 9×9: both were checked with ZXing + OpenCV.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [repo, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const { size: N, m } = JSON.parse(fs.readFileSync(path.join(__dirname, 'matrix.json'), 'utf8'));
const f = p => 'file://' + path.join(repo, p);

const brandSrc = fs.readFileSync(path.join(repo, 'components/Brand.tsx'), 'utf8');
const B = Object.fromEntries(['EMBLEM', 'WORDMARK', 'TAGLINE', 'ORNAMENT', 'CORNER'].flatMap(k => ['D', 'VB'].map(x => [`${k}_${x}`, brandSrc.match(new RegExp(`${k}_${x} = "([^"]+)"`))[1]])));
const svg = (k, cls, style = '') => `<svg class="${cls}" style="${style}" viewBox="${B[k + '_VB']}"><path fill="currentColor" fill-rule="evenodd" d="${B[k + '_D']}"/></svg>`;

// ---- QR geometry
const KO = 9;                            // centre knock-out for the logo (modules)
const k0 = (N - KO) / 2, k1 = k0 + KO;   // 12..21
const inFinder = (x, y) => (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
const inKnock = (x, y) => x >= k0 && x < k1 && y >= k0 && y < k1;

/** Build the QR as an SVG (viewBox in modules, with a quiet zone of `qz`). */
function qrSVG({ fg = '#1b2540', eye = fg, pupil = eye, dot = 'round', qz = 4, logo = 'navy' }) {
  let mods = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!m[y][x] || inFinder(x, y) || inKnock(x, y)) continue;
    if (dot === 'round') mods += `<circle cx="${x + .5}" cy="${y + .5}" r=".46"/>`;
    else if (dot === 'soft') mods += `<rect x="${x + .06}" y="${y + .06}" width=".88" height=".88" rx=".3"/>`;
    else mods += `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`;
  }
  // Finder "eyes": softly rounded. Keep radii small (outer <= ~1.2 modules) or strict decoders stop finding them.
  const rr = (x, y, w, r) => `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${w - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${w - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`;
  const eyeAt = (x, y) => `
    <path fill="${eye}" fill-rule="evenodd" d="${rr(x, y, 7, .9)} ${rr(x + 1, y + 1, 5, .5)}"/>
    <path fill="${pupil}" d="${rr(x + 2, y + 2, 3, .5)}"/>`;
  const c = N / 2, r = KO / 2 - .35;
  const badge = logo === 'navy'
    ? `<circle cx="${c}" cy="${c}" r="${r}" fill="#1b2540"/><circle cx="${c}" cy="${c}" r="${r - .45}" fill="none" stroke="#f3c37c" stroke-width=".18"/>`
    : `<circle cx="${c}" cy="${c}" r="${r}" fill="#080d1b"/><circle cx="${c}" cy="${c}" r="${r - .45}" fill="none" stroke="#f3c37c" stroke-width=".18"/>`;
  const ew = r * 1.18, eh = ew * 430 / 335;
  const emblem = `<svg x="${c - ew / 2}" y="${c - eh / 2 - .1}" width="${ew}" height="${eh}" viewBox="${B.EMBLEM_VB}"><path fill="#f3c37c" fill-rule="evenodd" d="${B.EMBLEM_D}"/></svg>`;
  return `<svg class="qr" viewBox="${-qz} ${-qz} ${N + qz * 2} ${N + qz * 2}" shape-rendering="geometricPrecision">
    <g fill="${fg}">${mods}</g>${eyeAt(0, 0)}${eyeAt(N - 7, 0)}${eyeAt(0, N - 7)}${badge}${emblem}</svg>`;
}

// starfield
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const stars = n => Array.from({ length: n }, () => { const s = rnd() < .88 ? 1 + rnd() * 1.4 : 2.4 + rnd() * 1.6; return `<i style="left:${(rnd() * 100).toFixed(2)}%;top:${(rnd() * 100).toFixed(2)}%;width:${s}px;height:${s}px;opacity:${(.25 + rnd() * .7).toFixed(2)}"></i>`; }).join('');

const base = (w, h) => `
@font-face{font-family:LDSerif;src:url(${f('app/instrument-serif-latin-400-normal.woff2')})}
@font-face{font-family:LDSerif;font-style:italic;src:url(${f('app/instrument-serif-latin-400-italic.woff2')})}
@font-face{font-family:LDSans;src:url(${f('app/outfit-latin-wght-normal.woff2')});font-weight:100 900}
*{box-sizing:border-box;margin:0}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:transparent}
body{position:relative;font-family:LDSans}
.stars i{position:absolute;border-radius:50%;background:#fff;box-shadow:0 0 6px rgba(255,255,255,.6)}
.paper{background:#efe5cd url(${f('public/img/paper.webp')});background-size:600px;background-blend-mode:multiply}
.qr{display:block;width:100%;height:auto}
.kick{font-size:20px;font-weight:500;letter-spacing:.4em;text-transform:uppercase}
`;

const promise = `No Ajinomoto · No trans fat · No food colour`;

const designs = {
  // 1. Classic menu-card: paper, navy, thin double gold rule
  'luna-qr-classic': [1000, 1180, `
  <style>
  body{display:grid;place-items:center}
  .card{position:absolute;inset:0;border-radius:36px;padding:70px 80px;display:flex;flex-direction:column;align-items:center;color:#1b2540}
  .card::before{content:"";position:absolute;inset:22px;border:2px solid #c99a4f;border-radius:24px}
  .card::after{content:"";position:absolute;inset:32px;border:1px solid rgba(201,154,79,.6);border-radius:18px}
  .wm{width:330px;height:auto;margin-top:16px}
  .orn{width:200px;height:auto;margin:20px 0 6px;opacity:.75}
  .box{width:640px;margin-top:22px}
  .cta{font-family:LDSerif;font-size:64px;line-height:1;margin-top:28px}
  .cta em{color:#d4694e}
  .kick{color:#d4694e;font-size:17px;margin-top:16px}
  </style>
  <div class="card paper">
    ${svg('WORDMARK', 'wm')}
    ${svg('ORNAMENT', 'orn')}
    <div class="box">${qrSVG({ dot: 'soft', qz: 2 })}</div>
    <div class="cta">Scan for the <em>menu</em></div>
    <div class="kick">${promise}</div>
  </div>`],

  // 2. Night card: stars, gold double frame with corner ornaments, cream panel
  'luna-qr-night': [1000, 1290, `
  <style>
  .card{position:absolute;inset:0;border-radius:40px;overflow:hidden;color:#f4ecda;display:flex;flex-direction:column;align-items:center;padding:96px 90px 0;
    background:radial-gradient(70% 45% at 50% 0%,rgba(243,195,124,.22),transparent 70%),radial-gradient(90% 60% at 50% 110%,#1b2540,transparent 70%),#080d1b}
  .frame{position:absolute;inset:26px;border:2px solid rgba(243,195,124,.85);border-radius:28px}
  .frame2{position:absolute;inset:38px;border:1px solid rgba(243,195,124,.4);border-radius:20px}
  .corner{position:absolute;width:130px;height:auto;color:#f3c37c;opacity:.9}
  .emb{width:96px;height:auto;color:#f3c37c;filter:drop-shadow(0 0 18px rgba(243,195,124,.45))}
  .wm{width:300px;height:auto;margin-top:14px;color:#f4ecda}
  .tag{width:260px;height:auto;margin-top:12px;color:#f3c37c}
  .panel{width:620px;margin-top:40px;padding:26px;border-radius:34px;background:#f4ecda;box-shadow:0 0 0 6px rgba(243,195,124,.9),0 0 60px 10px rgba(243,195,124,.25)}
  .cta{margin-top:48px;font-family:LDSerif;font-style:italic;font-size:58px;color:#f3c37c;line-height:1}
  .kick{margin-top:14px;color:rgba(244,236,218,.75);font-size:16px}
  </style>
  <div class="card"><div class="stars">${stars(160)}</div>
    <div class="frame"></div><div class="frame2"></div>
    ${svg('CORNER', 'corner', 'left:48px;top:48px')}
    ${svg('CORNER', 'corner', 'right:48px;top:48px;transform:scaleX(-1)')}
    ${svg('CORNER', 'corner', 'left:48px;bottom:48px;transform:scaleY(-1)')}
    ${svg('CORNER', 'corner', 'right:48px;bottom:48px;transform:scale(-1,-1)')}
    ${svg('EMBLEM', 'emb')}${svg('WORDMARK', 'wm')}${svg('TAGLINE', 'tag')}
    <div class="panel">${qrSVG({ dot: 'round', qz: 1.5, eye: '#1b2540', pupil: '#d4694e' })}</div>
    <div class="cta">Scan · the menu</div>
    <div class="kick">${promise}</div>
  </div>`],

  // 3. Arch table tent: the Pichwai arch shape, gold glow
  'luna-qr-arch': [1000, 1450, `
  <style>
  body{background:transparent}
  .arch{position:absolute;left:60px;right:60px;top:40px;bottom:40px;border-radius:440px 440px 34px 34px;color:#1b2540;display:flex;flex-direction:column;align-items:center;padding:150px 80px 0;
    box-shadow:0 0 0 10px #d59a3c,0 0 0 13px #080d1b,0 0 0 15px rgba(243,195,124,.7)}
  .arch::before{content:"";position:absolute;inset:22px;border-radius:420px 420px 22px 22px;border:1.5px solid rgba(201,154,79,.7)}
  .emb{width:84px;height:auto;color:#1b2540}
  .ttl{font-family:LDSerif;font-size:96px;line-height:.9;margin-top:18px}
  .ttl em{color:#d4694e}
  .kick{color:#d4694e;font-size:16px;margin-top:20px}
  .box{width:600px;margin-top:30px}
  .orn{width:190px;height:auto;margin-top:18px;opacity:.7}
  .foot{margin-top:14px;font-size:20px;letter-spacing:.06em;color:rgba(27,37,64,.75)}
  </style>
  <div class="arch paper">
    ${svg('EMBLEM', 'emb')}
    <div class="ttl">The <em>menu.</em></div>
    <div class="kick">Point your camera here</div>
    <div class="box">${qrSVG({ dot: 'soft', qz: 2, eye: '#1b2540', pupil: '#d4694e' })}</div>
    ${svg('ORNAMENT', 'orn')}
    <div class="foot">${promise}</div>
  </div>`],

  // 4. Moon badge: round sticker, text on a circle
  'luna-qr-moon': [1200, 1200, `
  <style>
  .disc{position:absolute;inset:20px;border-radius:50%;
    background:radial-gradient(circle at 50% 35%,#1b2540,#080d1b 70%);box-shadow:0 0 0 8px #d59a3c,0 0 0 11px #080d1b,0 0 0 13px rgba(243,195,124,.6)}
  .ring{position:absolute;inset:0;width:100%;height:100%}
  .moonface{position:absolute;left:50%;top:50%;width:700px;height:700px;margin:-350px 0 0 -350px;border-radius:50%;
    background:radial-gradient(circle at 40% 35%,#fffaf0,#f4ecda 55%,#eadcbb);box-shadow:0 0 70px 18px rgba(243,195,124,.45),inset 0 0 40px rgba(201,154,79,.35)}
  .box{position:absolute;left:50%;top:50%;width:470px;margin:-235px 0 0 -235px}
  </style>
  <div class="disc"><div class="stars" style="position:absolute;inset:0;border-radius:50%;overflow:hidden">${stars(110)}</div></div>
  <svg class="ring" viewBox="0 0 1200 1200">
    <defs><path id="c" d="M600,600 m-455,0 a455,455 0 1,1 910,0 a455,455 0 1,1 -910,0"/></defs>
    <circle cx="600" cy="600" r="505" fill="none" stroke="rgba(243,195,124,.55)" stroke-width="1.5"/>
    <circle cx="600" cy="600" r="405" fill="none" stroke="rgba(243,195,124,.35)" stroke-width="1"/>
    <text font-family="LDSans" font-size="40" font-weight="500" letter-spacing="9" fill="#f3c37c"><textPath href="#c" startOffset="0" textLength="2830" lengthAdjust="spacing">LUNA DINE ✦ SCAN FOR THE MENU ✦ BEYOND FINE DINING ✦ SALKIA ✦</textPath></text>
  </svg>
  <div class="moonface"></div>
  <div class="box">${qrSVG({ dot: 'round', qz: 0, eye: '#1b2540', pupil: '#1b2540' })}</div>`],

  // 5. Plain: just the code + logo, for printers and designers
  'luna-qr-plain': [1000, 1000, `
  <style>body{background:#fff}.box{position:absolute;inset:0}</style>
  <div class="box">${qrSVG({ dot: 'square', qz: 4 })}</div>`],
};

(async () => {
  const b = await chromium.launch();
  for (const [name, [w, h, html]] of Object.entries(designs)) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    const file = path.join(out, name + '.html');
    fs.writeFileSync(file, `<!doctype html><html><head><meta charset="utf-8"><style>${base(w, h)}</style></head><body>${html}</body></html>`);
    await p.goto('file://' + file, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(out, name + '.png'), omitBackground: name !== 'luna-qr-plain' });
    await p.pdf({ path: path.join(out, name + '.pdf'), width: w + 'px', height: h + 'px', printBackground: true, pageRanges: '1' });
    fs.unlinkSync(file);
    await p.close();
  }
  // standalone vector of the code itself
  fs.writeFileSync(path.join(out, 'luna-qr.svg'), `<?xml version="1.0" encoding="UTF-8"?>\n` + qrSVG({ dot: 'square', qz: 4 }).replace('<svg class="qr"', '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" style="background:#fff"'));
  await b.close();
})();
