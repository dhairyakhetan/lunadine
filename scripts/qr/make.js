// Luna Dine QR designs. Run from the repo root (needs Playwright + Chromium, not a project dependency):
//   node scripts/qr/make.js . qr-codes menu      → menu codes  (https://luna-dine.vercel.app/menu)
//   node scripts/qr/make.js . qr-codes/review review → review codes (https://luna-dine.vercel.app/review, which redirects
//                                                    to the Google review page set as SITE.review in lib/site.ts)
// matrix-<set>.json is the QR matrix at error level H, made with Python segno:
//   segno.make(URL, error="h", boost_error=False).matrix  — regenerate it if the URL changes, then re-run this.
// Keep finder-eye radii small (outer <= ~1.2 modules) and the logo knock-out at 9×9: both were checked with ZXing + OpenCV.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [repoArg, outArg, set = 'menu'] = process.argv.slice(2);
const repo = path.resolve(repoArg), out = path.resolve(outArg);
fs.mkdirSync(out, { recursive: true });
const { size: N, m } = JSON.parse(fs.readFileSync(path.join(__dirname, `matrix-${set}.json`), 'utf8'));
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

const menuDesigns = {
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


// Google "G" (four-colour mark), for the "review us on Google" designs
const G = s => `<svg viewBox="0 0 48 48" width="${s}" height="${s}"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;
const starRow = (n, size, color) => Array.from({ length: n }, () => `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path fill="${color}" d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8z"/></svg>`).join('');
// the sticker's wavy divider
const wave = (w, y, amp, fill, stroke) => `<svg class="wave" viewBox="0 0 ${w} ${y + amp * 2}" preserveAspectRatio="none"><path d="M0 0H${w}V${y}C${w * .78} ${y + amp * 1.8} ${w * .55} ${y - amp * 1.2} ${w * .36} ${y + amp * .4}S${w * .08} ${y + amp * 1.6} 0 ${y + amp * .5}Z" fill="${fill}"/>${stroke ? `<path d="M${w} ${y}C${w * .78} ${y + amp * 1.8} ${w * .55} ${y - amp * 1.2} ${w * .36} ${y + amp * .4}S${w * .08} ${y + amp * 1.6} 0 ${y + amp * .5}" fill="none" stroke="${stroke}" stroke-width="5"/>` : ''}</svg>`;

const sticker = ({ band, bandText, accent, ink, bg, line, wordmark }) => `
  <style>
  .plate{position:absolute;inset:14px;border-radius:64px;overflow:hidden;background:${bg};box-shadow:0 0 0 2px ${line},0 30px 60px -20px rgba(0,0,0,.35)}
  .plate::after{content:"";position:absolute;inset:0;border-radius:64px;pointer-events:none;background:linear-gradient(155deg,rgba(255,255,255,.35),rgba(255,255,255,0) 38%,rgba(255,255,255,0) 70%,rgba(255,255,255,.12))}
  .band{position:absolute;left:0;right:0;top:0;height:420px}
  .wave{position:absolute;left:0;top:0;width:100%;height:100%}
  .head{position:absolute;left:0;right:0;top:56px;display:flex;flex-direction:column;align-items:center;gap:18px;color:${bandText}}
  .g{width:118px;height:118px;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 6px 20px rgba(0,0,0,.18)}
  .lbl{font-size:30px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;text-align:center;line-height:1.25}
  .stars{display:flex;gap:8px}
  .box{position:absolute;left:50%;top:430px;width:560px;margin-left:-280px}
  .foot{position:absolute;left:0;right:0;bottom:46px;display:flex;flex-direction:column;align-items:center;gap:10px;color:${ink}}
  .foot .wm{width:200px;height:auto}
  .foot small{font-size:18px;font-weight:500;letter-spacing:.3em;text-transform:uppercase;color:${ink};opacity:.62}
  </style>
  <div class="plate">
    <div class="band">${wave(1000, 330, 34, band, accent)}</div>
    <div class="head"><span class="g">${G(74)}</span><span class="lbl">Leave us your review<br>on Google</span><span class="stars">${starRow(5, 34, accent)}</span></div>
    <div class="box">${qrSVG({ dot: 'soft', qz: 1.5, fg: ink, eye: ink, pupil: ink })}</div>
    <div class="foot">${wordmark ? svg('WORDMARK', 'wm') : ''}<small>Scan · Rate · Review</small></div>
  </div>`;

const reviewDesigns = {
  // 1. The desk-sticker layout, in Luna colours: navy band, gold wave + stars, cream plate
  'luna-review-sticker': [1000, 1200, sticker({ band: '#1b2540', bandText: '#f4ecda', accent: '#f3c37c', ink: '#1b2540', bg: '#f7f1e3', line: 'rgba(201,154,79,.8)', wordmark: true })],
  // 2. The same layout in classic Google blue on white
  'luna-review-google': [1000, 1200, sticker({ band: '#1a73e8', bandText: '#ffffff', accent: '#fbbc05', ink: '#202124', bg: '#ffffff', line: 'rgba(26,115,232,.35)', wordmark: true })],
  // 3. Night card
  'luna-review-night': [1000, 1300, `
  <style>
  .card{position:absolute;inset:0;border-radius:40px;overflow:hidden;color:#f4ecda;display:flex;flex-direction:column;align-items:center;padding:90px 90px 0;
    background:radial-gradient(70% 45% at 50% 0%,rgba(243,195,124,.22),transparent 70%),radial-gradient(90% 60% at 50% 110%,#1b2540,transparent 70%),#080d1b}
  .frame{position:absolute;inset:26px;border:2px solid rgba(243,195,124,.85);border-radius:28px}
  .frame2{position:absolute;inset:38px;border:1px solid rgba(243,195,124,.4);border-radius:20px}
  .emb{width:84px;height:auto;color:#f3c37c}
  .ttl{font-family:LDSerif;font-size:76px;line-height:1;margin-top:20px;text-align:center}
  .ttl em{color:#f3c37c}
  .sub{display:flex;align-items:center;gap:14px;margin-top:20px;font-size:24px;letter-spacing:.08em}
  .sub .g{width:46px;height:46px;border-radius:50%;background:#fff;display:grid;place-items:center}
  .stars{display:flex;gap:8px;margin-top:20px}
  .panel{width:560px;margin-top:34px;padding:24px;border-radius:30px;background:#f4ecda;box-shadow:0 0 0 6px rgba(243,195,124,.9),0 0 60px 10px rgba(243,195,124,.25)}
  .kick{margin-top:30px;color:rgba(244,236,218,.75);font-size:16px}
  </style>
  <div class="card"><div class="stars-bg">${''}</div><div class="stars" style="position:absolute;inset:0">${stars(150)}</div>
    <div class="frame"></div><div class="frame2"></div>
    ${svg('EMBLEM', 'emb')}
    <div class="ttl">Enjoyed your<br><em>evening?</em></div>
    <div class="sub"><span class="g">${G(30)}</span>Leave us a review on Google</div>
    <div class="stars" style="position:relative">${starRow(5, 40, '#f3c37c')}</div>
    <div class="panel">${qrSVG({ dot: 'round', qz: 1.5, eye: '#1b2540', pupil: '#d4694e' })}</div>
    <div class="kick">Luna Dine · Salkia, Howrah</div>
  </div>`],
  // 4. Round moon sticker
  'luna-review-moon': [1200, 1200, `
  <style>
  .disc{position:absolute;inset:20px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#1b2540,#080d1b 70%);box-shadow:0 0 0 8px #d59a3c,0 0 0 11px #080d1b,0 0 0 13px rgba(243,195,124,.6)}
  .ring{position:absolute;inset:0;width:100%;height:100%}
  .moonface{position:absolute;left:50%;top:50%;width:700px;height:700px;margin:-350px 0 0 -350px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fffaf0,#f4ecda 55%,#eadcbb);box-shadow:0 0 70px 18px rgba(243,195,124,.45),inset 0 0 40px rgba(201,154,79,.35)}
  .box{position:absolute;left:50%;top:50%;width:470px;margin:-250px 0 0 -235px}
  .under{position:absolute;left:0;right:0;top:50%;margin-top:236px;display:flex;justify-content:center;gap:6px}
  </style>
  <div class="disc"><div class="stars" style="position:absolute;inset:0;border-radius:50%;overflow:hidden">${stars(110)}</div></div>
  <svg class="ring" viewBox="0 0 1200 1200">
    <defs><path id="c" d="M600,600 m-455,0 a455,455 0 1,1 910,0 a455,455 0 1,1 -910,0"/></defs>
    <circle cx="600" cy="600" r="505" fill="none" stroke="rgba(243,195,124,.55)" stroke-width="1.5"/>
    <circle cx="600" cy="600" r="405" fill="none" stroke="rgba(243,195,124,.35)" stroke-width="1"/>
    <text font-family="LDSans" font-size="40" font-weight="500" letter-spacing="9" fill="#f3c37c"><textPath href="#c" startOffset="0" textLength="2830" lengthAdjust="spacing">LOVED IT? ✦ REVIEW US ON GOOGLE ✦ LUNA DINE ✦ SALKIA ✦</textPath></text>
  </svg>
  <div class="moonface"></div>
  <div class="box">${qrSVG({ dot: 'round', qz: 0 })}</div>
  <div class="under">${starRow(5, 30, '#c99a4f')}</div>`],
  // 5. Plain
  'luna-review-plain': [1000, 1000, `<style>body{background:#fff}.box{position:absolute;inset:0}</style><div class="box">${qrSVG({ dot: 'square', qz: 4 })}</div>`],
};
const designs = set === 'review' ? reviewDesigns : menuDesigns;
const plainName = set === 'review' ? 'luna-review-plain' : 'luna-qr-plain';
const svgName = set === 'review' ? 'luna-review-qr.svg' : 'luna-qr.svg';

(async () => {
  const b = await chromium.launch();
  for (const [name, [w, h, html]] of Object.entries(designs)) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    const file = path.join(out, name + '.html');
    fs.writeFileSync(file, `<!doctype html><html><head><meta charset="utf-8"><style>${base(w, h)}</style></head><body>${html}</body></html>`);
    await p.goto('file://' + file, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(out, name + '.png'), omitBackground: name !== plainName });
    await p.pdf({ path: path.join(out, name + '.pdf'), width: w + 'px', height: h + 'px', printBackground: true, pageRanges: '1' });
    fs.unlinkSync(file);
    await p.close();
  }
  // standalone vector of the code itself
  fs.writeFileSync(path.join(out, svgName), `<?xml version="1.0" encoding="UTF-8"?>\n` + qrSVG({ dot: 'square', qz: 4 }).replace('<svg class="qr"', '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" style="background:#fff"'));
  await b.close();
})();
