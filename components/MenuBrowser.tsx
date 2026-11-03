"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MENU, type MenuSection } from "@/lib/menu";
import { MENU_ISSUES } from "@/lib/menu-issues";
import { jumpToY, pageTop, reducedMotion, scrollToY } from "@/lib/scroll";
import { IAlert, IClose, IUp, Veg } from "./Icons";

const price = (p: number | "MRP") => (typeof p === "number" ? `₹${p}` : p);
/** Moon phase for section i of n: the menu waxes from a thin crescent at the first section to a full moon at the last. */
const phase = (i: number, n: number) => (n > 1 ? 0.12 + 0.88 * i / (n - 1) : 1).toFixed(3);
const phone = () => matchMedia("(max-width:700px)").matches; // the phone layout (globals.css, same breakpoint)
const shown = (el: Element) => el.getClientRects().length > 0; // false when the diet filter hides it

/* Review mode: the "Menu issues" button and inline flags. Off on the production domain unless the
   URL has ?review, so customers never see it; on localhost and preview deploys it's always on. */
const isReview = (prodHost: string) => {
  try {
    return new URLSearchParams(location.search).has("review") || location.hostname !== prodHost;
  } catch { return false; }
};
const FLAGS = new Map<string, number[]>(); // dish name -> indexes in MENU_ISSUES
MENU_ISSUES.forEach((iss, i) => iss.items?.forEach(n => FLAGS.set(n, [...(FLAGS.get(n) ?? []), i])));
const SECTION_FLAGS = new Map(MENU_ISSUES.flatMap((iss, i) => (iss.section ? [[iss.section, i] as const] : [])));

/* The diet filter. Drinks ("x") are neither veg nor non-veg, so they show in every mode.
   The page renders the full menu once, and CSS applies the filter: html.diet-v / .diet-n hide the other diet's groups,
   sections, chips and sheet tiles (globals.css, "the Veg / Non-veg filter"), using each section's data-v / data-n group counts
   and each group's data-t. So a switch re-renders no dish rows; every switch, the first included, costs the same.
   The choice is kept for the tab in sessionStorage; layout.tsx reads the same key to set the class before first paint. */
type Mode = "all" | "v" | "n";
const MODES: [Mode, string][] = [["all", "All"], ["v", "Veg"], ["n", "Non-veg"]];
const DIET_KEY = "ld-diet"; // also read by the inline script in app/layout.tsx
const titleIn = (s: MenuSection, m: Mode) => (m !== "all" && s.titles?.[m]) || s.title;
/** What the chips, the Sections pill and the sheet show under a filter (worked out once, for all three, on arrival). */
const filterMenu = (m: Mode) => MENU.flatMap(s => {
  const groups = s.groups.filter(g => m === "all" || g.t === "x" || g.t === m);
  return groups.length ? [{
    id: s.id, title: titleIn(s, m), count: groups.reduce((n, g) => n + g.items.length, 0),
    veg: groups.some(g => g.t === "v"), non: groups.some(g => g.t === "n"),
  }] : [];
});
const FILTERED = { all: filterMenu("all"), v: filterMenu("v"), n: filterMenu("n") };
/** data-v / data-n: how many of a section's groups are left under Veg / Non-veg (0 hides it, 1 hides its group headings) */
const DIET_ATTRS = new Map(MENU.map(s => [s.id, { "data-v": s.groups.filter(g => g.t !== "n").length, "data-n": s.groups.filter(g => g.t !== "v").length }]));
/** --pa / --pv / --pn: a section's moon phase under each filter (globals.css picks the current one into --p) */
const PHASES = new Map(MENU.map(s => [s.id, Object.fromEntries(MODES.map(([m]) => {
  const i = FILTERED[m].findIndex(x => x.id === s.id);
  return [`--p${m[0]}`, i < 0 ? "1" : phase(i, FILTERED[m].length)];
})) as React.CSSProperties]));
/** A section's title in the list. The list is rendered once, so a section whose name depends on the filter
 *  carries all its names and CSS shows the one for the current filter (.tm in globals.css). */
const SecTitle = ({ s }: { s: MenuSection }) => s.titles
  ? <>{MODES.map(([m]) => <span key={m} className="tm" data-m={m}>{titleIn(s, m)}</span>)}</>
  : s.title;
/** the section title as it reads on screen right now */
const titleNow = (head: Element) => {
  const h = head.querySelector("h2");
  return ([...(h?.querySelectorAll(".tm") ?? [])].find(shown) ?? h)?.textContent ?? "";
};

/* The switch animation's timing. GLIDE starts at 2x its average speed (EASE starts at 4.5x, which reads as a skip). */
const EASE = "cubic-bezier(.22,1,.36,1)", GLIDE = "cubic-bezier(.4,.8,.3,1)", OUT = "cubic-bezier(.55,0,1,.45)";
/** what moves on a switch (dish rows, group headings, section titles, the closing note), and a key that names it in both menus */
const MOVERS = "li[data-k], .mgrp > h3, .msec__head, .mnote";
const keyOf = (el: HTMLElement) =>
  el.tagName === "LI" ? el.dataset.k!
    : el.tagName === "H3" ? `g|${el.closest(".msec")?.id}|${el.textContent}`
    : el.classList.contains("mnote") ? "note"
    : el.dataset.id ? `c|${el.dataset.id}` // a section chip
    : `s|${el.closest(".msec")?.id}`;
/** our running Web Animations (not CSS transitions like the moons' and the pill's, which retarget by themselves) */
const ourAnims = (root: Element | null) => (root?.getAnimations({ subtree: true }) ?? []).filter(a => a.constructor === Animation);
type Box = { x: number; y: number; h: number; vis: boolean; t?: string };
/** the screen just before a switch: every mover's and card's box, what was in view, the phone's stuck section title */
type Snap = { pos: Map<string, Box>; cards: Map<string, Box>; seen: { k: string; el: HTMLElement; r: DOMRect }[]; line: number; stuck: string | null; stuckT: string; row: DOMRect | null };
/** where the reader is: a section kept put (no keys), or the first of `keys` (dishes) that's still shown, at `top` on screen */
type Anchor = { sec: string; keys: string[]; top: number };

/** `prodHost`: the production hostname, resolved on the server at build time (env vars aren't available here). */
export default function MenuBrowser({ prodHost }: { prodHost: string }) {
  const [active, setActive] = useState(MENU[0].id);
  const [review, setReview] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [pulse, setPulse] = useState(-1);
  const [sheet, setSheet] = useState(false);
  const [mode, setMode] = useState<Mode>("all");
  const [thumbOn, setThumbOn] = useState(false);
  const secs = FILTERED[mode];

  const bar = useRef<HTMLDivElement>(null);
  const filt = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const chips = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const issuesBox = useRef<HTMLDivElement>(null);
  const sheetBox = useRef<HTMLDivElement>(null);
  const sheetBg = useRef<HTMLDivElement>(null);
  const pillBtn = useRef<HTMLButtonElement>(null);

  const barRect = () => bar.current?.getBoundingClientRect();
  /** Page Y that puts `el` just under the sticky bar. On phones each section's title is sticky too (under the bar),
   *  so a section lands flush under the bar and anything inside a section lands under its title. */
  const underBarY = (el: HTMLElement, gap = 12) => {
    const head = el.closest(".msec")?.querySelector<HTMLElement>(".msec__head");
    const off = !phone() ? gap : el.classList.contains("msec") ? 0 : (head?.offsetHeight ?? 0) + gap;
    return Math.max(0, pageTop(el) - (barRect()?.height ?? 56) - off);
  };
  /** Menu jumps (chips, sheet tiles, review "Show"). Sections are never transformed, so their box is their layout box. */
  const scrollUnderBar = (el: HTMLElement | null, gap = 12) => { if (el) scrollToY(underBarY(el, gap)); };
  /** On phones, the section title currently stuck under the bar. */
  const stuckHead = () => {
    if (!phone()) return null;
    const line = barRect()?.bottom ?? 0;
    return [...(body.current?.querySelectorAll<HTMLElement>(".msec__head") ?? [])]
      .find(h => { const r = h.getBoundingClientRect(); return r.height > 0 && r.top <= line + 1 && r.bottom > line; }) ?? null;
  };
  /** Top of the part of the screen where dishes scroll: under the bar, and on phones under the stuck section title. */
  const readingLine = () => Math.max(0, stuckHead()?.getBoundingClientRect().bottom ?? barRect()?.bottom ?? 0);
  /** the section crossing the line under the bar (the scrollspy's rule); sections hidden by the filter don't count */
  const spyId = () => {
    const line = (barRect()?.height ?? 56) + 40;
    let id = "";
    body.current?.querySelectorAll<HTMLElement>(".msec").forEach(s => { if (shown(s) && (!id || s.getBoundingClientRect().top <= line)) id = s.id; });
    return id || MENU[0].id;
  };

  /* ---- Switching All / Veg / Non-veg keeps your place ----
     Just before the switch, capture() notes the first dish under the bar (plus the dishes after it in its section)
     and where it is on screen. After the class flips, and before the browser paints, placeY() works out the scroll
     that puts the first of those dishes that's still shown exactly where it was. If none is, it goes to the start of
     that section; if the section is gone too, to the nearest one that's left. */
  const capture = (): Anchor | null => {
    const line = readingLine(), barBottom = barRect()?.bottom ?? 0;
    const row = [...(body.current?.querySelectorAll<HTMLElement>("li[data-k]") ?? [])].find(li => shown(li) && li.getBoundingClientRect().bottom > line + 4);
    const sec = row?.closest<HTMLElement>(".msec");
    if (!row || !sec) return null;
    const secTop = sec.getBoundingClientRect().top;
    if (secTop >= barBottom - 1) return { sec: sec.id, keys: [], top: secTop }; // its title is in view: keep the section put
    const rows = [...sec.querySelectorAll<HTMLElement>("li[data-k]")].filter(shown);
    return { sec: sec.id, keys: rows.slice(rows.indexOf(row)).map(li => li.dataset.k!), top: row.getBoundingClientRect().top };
  };
  /** Runs after snapshot() has cancelled the running animations, so boxes are layout boxes here: a round trip lands
   *  on the very same pixel. */
  const placeY = ({ sec: id, keys, top }: Anchor): number | null => {
    const sec = document.getElementById(id);
    if (sec && shown(sec)) {
      if (!keys.length) return pageTop(sec) - top;
      const rows = [...sec.querySelectorAll<HTMLElement>("li[data-k]")].filter(shown);
      const hit = keys.map(k => rows.find(li => li.dataset.k === k)).find(Boolean);
      return hit ? pageTop(hit) - top : underBarY(sec);
    }
    // the section is filtered out: go to the nearest one that's left, in either direction (the later one wins a
    // tie). Not simply "the next one": that walks you further down the menu with every switch.
    const i = MENU.findIndex(s => s.id === id);
    const near = MENU.map((s, j) => ({ el: document.getElementById(s.id), d: Math.abs(j - i) - (j > i ? 0.5 : 0) }))
      .filter(x => x.el && shown(x.el)).sort((a, b) => a.d - b.d)[0]?.el;
    return near ? underBarY(near) : null;
  };
  /* Where you were reading before a run of switches. Switching back and forth without scrolling keeps placing from
     this, not from wherever the last switch had to put you, so a round trip always comes back to the same dish
     (Non-veg -> Veg -> Non-veg lands exactly where you started). It's forgotten as soon as you scroll yourself, or
     the window resizes (the scrollspy's listener below). Scrolls in the moment after a switch are ours (placing, or
     the smooth scroller settling a clamped position at the end of the page) and don't count. */
  const home = useRef<Anchor | null>(null);
  const ourScrollUntil = useRef(0);

  /* ---- The switch animates (unless reduced motion) ----
     Everything on screen before or after takes part:
     - what stays glides from where it was to where it lands (up to about a screen; further than that it leaves and
       arrives instead), also when that's off screen, so nothing just vanishes;
     - what leaves squashes flat and fades: a copy of it, drawn where it was, in a layer clipped below the bar that
       keeps up with scrolling (ghostLayer);
     - what arrives springs up line by line, its veg / non-veg mark popping in;
     - desktop: each paper card's background (its ::before) stretches or shrinks from its old box to its new one, a
       card that goes away fades behind the menu, and the section chips glide sideways (animateChips);
     - phones: if a different section's title ends up stuck under the bar, its words fade up.
     Web Animations on transform and opacity only, never React's classes. A second tap mid-animation starts from
     where things are on screen right then (snapshot() reads them, then cancels what's running). */
  const layers = useRef(new Set<() => void>()); // removes each live layer of copies
  const freezers = useRef(new Set<() => void>()); // stops a layer following the scroll
  const pending = useRef<{ anchor: Anchor | null; snap: Snap | null } | null>(null); // a switch the layout effect is to finish
  /** a card's paper as it is on screen right now (its ::before may be mid-animation: translateY + scaleY from the top) */
  const cardBox = (el: HTMLElement, line: number): Box => {
    const r = el.getBoundingClientRect();
    const m = getComputedStyle(el, "::before").transform.match(/matrix\(([^)]+)\)/)?.[1].split(",").map(Number);
    const y = r.top + (m ? m[5] : 0), h = r.height * (m ? m[3] : 1);
    return { x: r.left, y, h, vis: y + h > line && y < innerHeight };
  };
  const snapshot = (): Snap | null => {
    const b = body.current;
    if (!b || reducedMotion()) return null;
    const line = readingLine(), vh = innerHeight, stuck = stuckHead();
    const pos = new Map<string, Box>(), cards = new Map<string, Box>(), seen: Snap["seen"] = [];
    const take = (el: HTMLElement, visible: (r: DOMRect) => boolean) => {
      if (!shown(el) || el === stuck) return;
      const r = el.getBoundingClientRect(), k = keyOf(el), vis = visible(r); // on-screen rects, mid-animation included
      pos.set(k, { x: r.left, y: r.top, h: r.height, vis, t: el.classList.contains("msec__head") ? titleNow(el) : undefined });
      if (vis) seen.push({ k, el, r });
    };
    b.querySelectorAll<HTMLElement>(MOVERS).forEach(el => take(el, r => r.bottom > line && r.top < vh));
    const c = chips.current, cr = c?.getBoundingClientRect();
    c?.querySelectorAll<HTMLElement>(":scope > button").forEach(el => take(el, r => !!cr && r.right > cr.left && r.left < cr.right));
    if (!phone()) b.querySelectorAll<HTMLElement>(".msec").forEach(el => { if (shown(el)) cards.set(el.id, cardBox(el, line)); });
    // that's the screen as it is; now drop running animations so the new ones start from exactly here
    [...ourAnims(b), ...ourAnims(bar.current)].forEach(a => a.cancel());
    return { pos, cards, seen, line, stuck: stuck?.closest(".msec")?.id ?? null, stuckT: stuck ? titleNow(stuck) : "", row: cr ?? null };
  };
  /** A fixed layer for copies of what left, drawn where it was, removed after `ms`. `follow`: it keeps up with page
   *  scrolling while they fade, so they don't drift (until the next switch re-anchors and freezes it). */
  const ghostLayer = (cls: string, box: string, ms: number, follow = false) => {
    const outer = document.createElement("div"), inner = outer.appendChild(document.createElement("div"));
    outer.className = cls;
    outer.style.cssText = box;
    inner.style.cssText = "position:absolute;inset:0";
    document.body.appendChild(outer);
    const y0 = scrollY, track = () => { inner.style.transform = `translateY(${y0 - scrollY}px)`; };
    const freeze = () => { removeEventListener("scroll", track); freezers.current.delete(freeze); };
    const done = () => { freeze(); outer.remove(); layers.current.delete(done); };
    if (follow) { addEventListener("scroll", track, { passive: true }); freezers.current.add(freeze); }
    layers.current.add(done);
    setTimeout(done, ms);
    return inner;
  };

  /* ---- the section chips row (desktop/tablet) ----
     The current section's chip is always in view: it's centred whenever the section changes, and right at a filter
     switch, before the chips move, so it glides straight to its place with the rest. Centring measures layout
     (offsetLeft inside .cats, which is position:relative), so chips mid-animation can't throw it off. If you scroll
     the row away yourself, it glides back to the current section after a few quiet seconds (not while the pointer
     is on it or a chip has keyboard focus). */
  const progUntil = useRef(0); // scroll events on the row before this time are ours, not the reader's
  const activeRef = useRef(active);
  activeRef.current = active;
  const centerChip = (id: string, smooth: boolean) => {
    const c = chips.current, a = c?.querySelector<HTMLElement>(`[data-id="${id}"]`);
    if (!c || !a || !c.clientWidth) return;
    const left = Math.max(0, Math.min(c.scrollWidth - c.clientWidth, a.offsetLeft + a.offsetWidth / 2 - c.clientWidth / 2));
    if (Math.abs(left - c.scrollLeft) < 1) return;
    const calm = smooth && !reducedMotion();
    progUntil.current = performance.now() + (calm ? 1000 : 120);
    c.scrollTo({ left, behavior: calm ? "smooth" : "auto" });
  };
  /* on a filter switch: chips that stay glide sideways to their new places, chips that go fade and shrink where
     they were (copies, over the row) while their neighbours close the gap, and new chips grow in as their
     neighbours slide apart. Calm, no overshoot. */
  const animateChips = (sn: Snap) => {
    const c = chips.current, cr = c?.getBoundingClientRect();
    if (!c || !cr?.width) return;
    const kept = new Set<string>();
    c.querySelectorAll<HTMLElement>(":scope > button").forEach(el => {
      const k = keyOf(el), r = el.getBoundingClientRect(), o = sn.pos.get(k), vis = r.right > cr.left && r.left < cr.right;
      if (o) kept.add(k);
      if (o && (o.vis || vis) && Math.abs(o.x - r.left) < cr.width) {
        if (Math.abs(o.x - r.left) >= 1) el.animate([{ transform: `translateX(${o.x - r.left}px)` }, { transform: "none" }],
          { duration: 520, delay: 40, easing: GLIDE, fill: "backwards" });
      } else if (vis) el.animate([{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: "none" }],
        { duration: 420, delay: 160, easing: EASE, fill: "backwards" });
    });
    const gone = sn.seen.filter(g => g.k.startsWith("c|") && !kept.has(g.k)), row = sn.row;
    if (!gone.length || !row) return;
    const layer = ghostLayer("mchipghosts", `left:${row.left}px;top:${row.top}px;width:${row.width}px;height:${row.height}px`, 320);
    gone.forEach(g => {
      const copy = layer.appendChild(g.el.cloneNode(true) as HTMLElement);
      copy.removeAttribute("data-v"); copy.removeAttribute("data-n"); // or the filter's CSS would hide the copy too
      copy.style.cssText = `position:absolute;left:${g.r.left - row.left}px;top:${g.r.top - row.top}px;width:${g.r.width}px;height:${g.r.height}px;margin:0`;
      copy.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.6)" }], { duration: 240, easing: OUT, fill: "forwards" });
    });
  };

  const animateSwitch = (sn: Snap) => {
    const b = body.current;
    if (!b) return;
    const line = readingLine(), vh = innerHeight;
    const glide = (el: HTMLElement, dx: number, dy: number) => el.animate([
      { transform: `translate(${dx}px,${dy}px) scale(1,.92)` },
      { transform: "translate(0,0) scale(1,1.04)", offset: 0.7 },
      { transform: "none" },
    ], { duration: 560, delay: 80, easing: GLIDE, fill: "backwards" }); // after the leavers have mostly gone
    const retitle = (head: HTMLElement) => head.querySelector("h2")?.animate([
      { opacity: 0, transform: "translateY(10px) scale(.96,.6)", transformOrigin: "0 60%" },
      { opacity: 1, transform: "scale(1.01,1.05)", transformOrigin: "0 60%", offset: 0.6 },
      { opacity: 1, transform: "none", transformOrigin: "0 60%" },
    ], { duration: 520, delay: 120, easing: EASE, fill: "backwards" });
    let n = 0;
    const enter = (el: HTMLElement) => {
      const delay = 100 + Math.min(n++ * 28, 280), o = { transformOrigin: "0 50%" };
      el.animate([
        { ...o, opacity: 0, transform: "translateY(12px) scale(.94,.4)" },
        { ...o, opacity: 1, transform: "scale(1.01,1.08)", offset: 0.55 },
        { ...o, opacity: 1, transform: "none" },
      ], { duration: 520, delay, easing: EASE, fill: "backwards" });
      el.querySelectorAll<HTMLElement>(":scope > .vg").forEach(v => v.animate(
        [{ transform: "scale(0)" }, { transform: "scale(1.35)", offset: 0.6 }, { transform: "none" }],
        { duration: 480, delay: delay + 80, easing: EASE, fill: "backwards" }));
    };
    // glide only what moves up to about a screen; something that was on screen and is now far away leaves (a copy
    // squashes out where it was), and something that comes from far away arrives
    const near = vh * 0.9, staying = new Set<string>(), stuck = stuckHead();
    b.querySelectorAll<HTMLElement>(MOVERS).forEach(el => {
      if (!shown(el) || el === stuck) return;
      const k = keyOf(el), r = el.getBoundingClientRect(), o = sn.pos.get(k), vis = r.bottom > line - 40 && r.top < vh;
      const reach = o?.vis && vis ? near : near * 0.55; // coming from (or going) off screen: a shorter sweep
      if (o && (o.vis || vis) && Math.abs(o.y - r.top) <= reach) {
        staying.add(k);
        const dx = o.x - r.left, dy = o.y - r.top;
        if (Math.abs(dx) + Math.abs(dy) >= 1) glide(el, dx, dy);
        if (o.t !== undefined && vis && titleNow(el) !== o.t) retitle(el); // e.g. "Biryani & Pulao" -> "Rice & Pulao"
      } else {
        if (!o?.vis) staying.add(k); // wasn't on screen: nothing to take away
        if (vis) enter(el);
      }
    });
    animateChips(sn);
    // phones: a different section's title is now stuck under the bar: its words fade up (or just the title, if
    // it's the same section under a new name)
    if (stuck && stuck.closest(".msec")?.id !== sn.stuck) [...stuck.children].forEach(ch => enter(ch as HTMLElement));
    else if (stuck && titleNow(stuck) !== sn.stuckT) retitle(stuck);

    // desktop: paper cards stretch or shrink from their old box to the new one; one that went away fades out behind
    const keptCards = new Set<string>();
    if (!phone()) b.querySelectorAll<HTMLElement>(".msec").forEach(el => {
      if (!shown(el)) return;
      keptCards.add(el.id);
      const r = el.getBoundingClientRect(), o = sn.cards.get(el.id), vis = r.bottom > line && r.top < vh;
      const top = { transformOrigin: "50% 0" }, opts = { delay: 80, fill: "backwards", pseudoElement: "::before" } as const;
      if (o && (o.vis || vis)) {
        const dy = o.y - r.top, sy = o.h / Math.max(1, r.height);
        if (Math.abs(dy) >= 1 || Math.abs(sy - 1) > 0.002) el.animate([
          { ...top, transform: `translateY(${dy}px) scaleY(${sy.toFixed(4)})` }, { ...top, transform: "none" },
        ], { ...opts, duration: 560, easing: GLIDE });
      } else if (vis) el.animate([
        { ...top, opacity: 0, transform: "scaleY(.92)" }, { ...top, opacity: 1, transform: "none" },
      ], { ...opts, duration: 420, easing: EASE });
    });
    const goneCards = [...sn.cards].filter(([id, o]) => o.vis && !keptCards.has(id));
    if (goneCards.length) {
      const layer = ghostLayer("mghosts mghosts--back", `top:${sn.line}px`, 450, true), w = b.getBoundingClientRect();
      goneCards.forEach(([, o]) => {
        const card = layer.appendChild(document.createElement("div"));
        card.className = "mghost-card";
        card.style.cssText = `left:${w.left}px;top:${o.y - sn.line}px;width:${w.width}px;height:${o.h}px`;
        card.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.98,.6)" }], { duration: 260, easing: OUT, fill: "forwards" });
      });
    }

    // what left: copies where they were, squashing out (chips are left out: the row just makes room as it glides)
    const gone = sn.seen.filter(g => !staying.has(g.k) && !g.k.startsWith("c|"));
    if (!gone.length) return;
    const layer = ghostLayer("mghosts", `top:${sn.line}px`, 450, true);
    gone.forEach((g, i) => {
      const li = g.el.tagName === "LI", wrap = layer.appendChild(document.createElement(li ? "ul" : "div"));
      wrap.className = li ? "items" : g.el.tagName === "H3" ? "mgrp" : ""; // so the copy keeps its styles
      wrap.style.cssText = `position:absolute;left:${g.r.left}px;top:${g.r.top - sn.line}px;width:${g.r.width}px;margin:0;padding:0;columns:auto`;
      const copy = wrap.appendChild(g.el.cloneNode(true) as HTMLElement);
      if (copy.classList.contains("msec__head")) {
        copy.style.position = "static";
        const h = copy.querySelector("h2"), t = sn.pos.get(g.k)?.t;
        if (h && t) h.textContent = t; // its name as it was (the copy would follow the new filter)
        const m = g.el.querySelector(".mphase"), mc = copy.querySelector<HTMLElement>(".mphase");
        if (m && mc) mc.style.setProperty("--p", getComputedStyle(m).getPropertyValue("--p")); // keep its moon
      }
      copy.animate([
        { opacity: 1, transform: "none", transformOrigin: "0 50%" },
        { opacity: 0, transform: "scale(.97,.25)", transformOrigin: "0 50%" },
      ], { duration: 200, delay: Math.min(i * 8, 48), easing: OUT, fill: "forwards" });
    });
  };

  /* the gold pill behind the pressed filter button slides over: its leading edge first, the trailing edge catching
     up, so it stretches and settles (two @property lengths with different timings, see globals.css). It's measured
     again, without animating, whenever the buttons change size (e.g. when the font arrives). */
  const placeThumb = (animate: boolean) => {
    const g = filt.current, t = thumb.current, btn = g?.querySelector<HTMLElement>('button[aria-pressed="true"]');
    if (!g || !t || !btn) return;
    const l = btn.offsetLeft, r = g.clientWidth - l - btn.offsetWidth;
    t.dataset.dir = l >= (parseFloat(t.style.getPropertyValue("--tl")) || 0) ? "r" : "l";
    if (!animate) t.style.transition = "none";
    t.style.setProperty("--tl", l + "px");
    t.style.setProperty("--tr", r + "px");
    if (!animate) { void t.offsetWidth; t.style.transition = ""; return; }
    btn.querySelector(".vg")?.animate([{ transform: "scale(1)" }, { transform: "scale(.6,1.3)", offset: 0.35 }, { transform: "scale(1.2)", offset: 0.7 }, { transform: "none" }], { duration: 480, easing: "ease-out" });
  };
  useEffect(() => {
    const g = filt.current, all = layers.current;
    if (!g) return;
    const ro = new ResizeObserver(() => placeThumb(false));
    ro.observe(g);
    g.querySelectorAll("button").forEach(btn => ro.observe(btn));
    return () => { ro.disconnect(); all.forEach(done => done()); };
  }, []);

  /** A tap on All / Veg / Non-veg. `keepPlace: false` (review "Show"): no placing and no animation. */
  const switchMode = (m: Mode, keepPlace = true) => {
    if (m === mode) return;
    // capture first: it reads where things are on screen, before snapshot() drops the running animations
    const anchor = keepPlace ? home.current ?? capture() : null;
    pending.current = { anchor, snap: keepPlace ? snapshot() : null };
    // copies still fading from a quick earlier tap stay where they are on screen: the re-anchoring scroll that's
    // about to happen keeps the menu in place on screen too, so they mustn't follow it
    [...freezers.current].forEach(f => f());
    setMode(m);
  };
  /* restore the filter saved for this tab. On a fresh load layout.tsx has already set html's class; after a
     client-side navigation it hasn't, so set it here (before paint, so the full menu never shows) */
  useLayoutEffect(() => {
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(DIET_KEY); } catch {}
    if (saved === "v" || saved === "n") { document.documentElement.classList.add(`diet-${saved}`); setMode(saved); }
  }, []);
  /* the filter changed: place the thumb, and if it was a tap (not the restore above, where the class is already
     right and nothing should move), flip the class, save it, keep the reader's place and animate, all before paint */
  useLayoutEffect(() => {
    const p = pending.current;
    pending.current = null;
    placeThumb(!!p && !reducedMotion());
    setThumbOn(true);
    if (!p) return;
    const root = document.documentElement;
    root.classList.toggle("diet-v", mode === "v");
    root.classList.toggle("diet-n", mode === "n");
    try { mode === "all" ? sessionStorage.removeItem(DIET_KEY) : sessionStorage.setItem(DIET_KEY, mode); } catch {}
    window.LD?.lenis?.resize();
    const y = p.anchor && placeY(p.anchor);
    if (y != null) jumpToY(Math.max(0, Math.round(y)));
    home.current = p.anchor; // remembered until the reader scrolls
    ourScrollUntil.current = performance.now() + 400;
    // the section you're in now, and its chip centred at once, so the chip animation glides it straight there
    const id = spyId();
    setActive(id);
    centerChip(id, false);
    if (p.snap) animateSwitch(p.snap); // after placing, so old and new places are both screen positions
  }, [mode]);

  /* scroll / resize: the scrollspy (the section crossing the line under the bar is active), and forgetting `home`
     once the reader has moved */
  useEffect(() => {
    let ticking = false;
    const frame = () => { ticking = false; setActive(spyId()); };
    const onScroll = (e: Event) => {
      if (e.type === "resize" || performance.now() > ourScrollUntil.current) home.current = null;
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    };
    const ac = new AbortController(), o = { passive: true, signal: ac.signal };
    addEventListener("scroll", onScroll, o);
    addEventListener("resize", onScroll, o);
    frame();
    return () => ac.abort();
  }, []);

  /* chips row: fade an edge only while there are more chips hidden past it (so at the start, the first chip sits clean) */
  useEffect(() => {
    const c = chips.current;
    if (!c) return;
    const upd = () => {
      c.style.setProperty("--fl", c.scrollLeft > 2 ? "28px" : "0px");
      c.style.setProperty("--fr", c.scrollLeft < c.scrollWidth - c.clientWidth - 2 ? "28px" : "0px");
    };
    upd();
    const ac = new AbortController(), o = { passive: true, signal: ac.signal };
    c.addEventListener("scroll", upd, o);
    addEventListener("resize", upd, o);
    return () => ac.abort();
  }, [mode]);

  /* keep the current section's chip in view */
  useEffect(() => { centerChip(active, true); }, [active]);
  /* scrolled the row away? it glides back to the current section after a few quiet seconds */
  useEffect(() => {
    const c = chips.current;
    if (!c) return;
    let t = 0;
    const arm = () => { clearTimeout(t); t = window.setTimeout(back, 2500); };
    const back = () => {
      if (c.matches(":hover") || c.querySelector(":focus-visible")) arm(); // still looking: wait
      else centerChip(activeRef.current, true);
    };
    const onScroll = () => { if (performance.now() > progUntil.current) arm(); };
    c.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(t); c.removeEventListener("scroll", onScroll); };
  }, []);

  /* phone section sheet, as it opens (before paint): the grid starts scrolled so the current section's tile is in
     the middle, and the tiles in view rise in with a short stagger while the sheet slides up */
  useLayoutEffect(() => {
    const grid = sheetBox.current?.querySelector<HTMLElement>(".msheet__grid");
    if (!sheet || !grid) return;
    const on = grid.querySelector<HTMLElement>("button.on");
    if (on) grid.scrollTop = Math.max(0, on.offsetTop + on.offsetHeight / 2 - grid.clientHeight / 2); // .msheet__grid is position:relative
    if (reducedMotion()) return;
    let i = 0;
    grid.querySelectorAll<HTMLElement>(":scope > button").forEach(t => {
      const top = t.offsetTop - grid.scrollTop;
      if (!shown(t) || top + t.offsetHeight < 0 || top > grid.clientHeight) return;
      t.animate([{ opacity: 0, transform: "translateY(18px) scale(.96)" }, { opacity: 1, transform: "none" }],
        { duration: 460, delay: 90 + Math.min(i++ * 30, 300), easing: EASE, fill: "backwards" });
    });
  }, [sheet]);
  /* phone section sheet: lock the page behind it, close on Escape, move focus in and back out */
  useEffect(() => {
    if (!sheet) return;
    const root = document.documentElement, lenis = window.LD?.lenis;
    root.style.overflow = "hidden";
    lenis?.stop();
    const grid = sheetBox.current?.querySelector(".msheet__grid");
    (grid?.querySelector<HTMLElement>(".on") ?? grid?.querySelector<HTMLElement>("button"))?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSheet(false); };
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      root.style.overflow = "";
      lenis?.start();
      pillBtn.current?.focus({ preventScroll: true });
    };
  }, [sheet]);
  /* phone section sheet: drag its header down to close it. Inline styles only (React owns the classes). */
  useEffect(() => {
    const box = sheetBox.current, bg = sheetBg.current, head = box?.querySelector<HTMLElement>(".msheet__head");
    if (!box || !bg || !head) return;
    let id = -1, y0 = 0, dy = 0, t = 0, v = 0; // v: downward speed in px/ms, from the last moves
    const set = (tf: string, op: string, tr: string) => {
      box.style.transform = tf; box.style.transition = tr;
      bg.style.opacity = op; bg.style.transition = tr;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      set("", "", ""); // back to the stylesheet: it slides home, or out if we close it below
      const fast = dy > 24 && v > 0.4 && e.timeStamp - t < 120; // a flick (still moving when let go)
      if (dy > Math.min(120, box.offsetHeight * 0.25) || fast) setSheet(false);
    };
    const ac = new AbortController(), o = { signal: ac.signal };
    head.addEventListener("pointerdown", e => {
      if (!e.isPrimary || (e.target as Element).closest("button")) return;
      id = e.pointerId; y0 = e.clientY; dy = 0; t = e.timeStamp; v = 0;
      head.setPointerCapture(id);
    }, o);
    head.addEventListener("pointermove", e => {
      if (e.pointerId !== id) return;
      const d = Math.max(0, e.clientY - y0);
      v = 0.7 * ((d - dy) / Math.max(1, e.timeStamp - t)) + 0.3 * v;
      dy = d; t = e.timeStamp;
      set(`translateY(${dy}px)`, String(1 - Math.min(1, dy / box.offsetHeight)), "none");
    }, o);
    head.addEventListener("pointerup", up, o);
    head.addEventListener("pointercancel", up, o);
    return () => ac.abort();
  }, []);
  const jump = (id: string | null) => {
    setSheet(false);
    // after the sheet's cleanup has unlocked scrolling
    requestAnimationFrame(() => id ? scrollUnderBar(document.getElementById(id)) : scrollToY(0));
  };
  const cur = Math.max(0, secs.findIndex(s => s.id === active));

  /* phone: the Sections pill's name ticks over (the old one slides up and out as the new one rises in), its count
     follows, and the pill eases to its new width instead of jumping. The width is kept as an explicit px value so
     the old one is known; it's measured again when the font arrives and on resize. Inline styles only. */
  const pillSmall = mode === "v" ? "Veg · sections" : mode === "n" ? "Non-veg · sections" : "Sections";
  const pillTitle = secs[cur]?.title ?? "", pillN = `${cur + 1}/${secs.length}`;
  const pillPrev = useRef<{ s: string; t: string; n: string } | null>(null);
  const pillGhost = useRef<HTMLElement | null>(null);
  const fitPill = (animate: boolean) => {
    const p = pillBtn.current;
    if (!p?.offsetWidth) return; // not on phones
    const w0 = p.getBoundingClientRect().width;
    p.style.transition = "none";
    p.style.width = "";
    const w1 = p.getBoundingClientRect().width;
    p.style.width = (animate ? w0 : w1) + "px";
    void p.offsetWidth;
    p.style.transition = "";
    if (animate && Math.abs(w1 - w0) > 0.5) p.style.width = w1 + "px"; // CSS eases it (globals.css)
  };
  useLayoutEffect(() => {
    const prev = pillPrev.current, p = pillBtn.current;
    pillPrev.current = { s: pillSmall, t: pillTitle, n: pillN };
    if (!p?.offsetWidth) return;
    if (!prev) { fitPill(false); return; }
    if (prev.s === pillSmall && prev.t === pillTitle && prev.n === pillN) return;
    fitPill(true);
    if (reducedMotion()) return;
    // the name ticks over inside its own clipped slot (.secpill__t): the old one slides up and out, the new one
    // rises in from below. The little label above only changes with the filter, and then it just cross-fades.
    const slot = p.querySelector<HTMLElement>(".secpill__t"), now = slot?.firstElementChild;
    if (prev.t !== pillTitle && slot && now) {
      pillGhost.current?.remove();
      const ghost = slot.appendChild(document.createElement("span")); // React keeps the slot's own child, so this is left alone
      ghost.className = "secpill__ghost";
      ghost.textContent = prev.t;
      pillGhost.current = ghost;
      ghost.animate([{ transform: "none", opacity: 1 }, { transform: "translateY(-100%)", opacity: 0 }],
        { duration: 300, easing: "cubic-bezier(.4,0,.6,1)", fill: "forwards" }).onfinish = () => ghost.remove();
      now.animate([{ transform: "translateY(100%)", opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: 420, delay: 40, easing: EASE, fill: "backwards" });
    }
    if (prev.s !== pillSmall) p.querySelector(".secpill__lbl > small")?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: EASE });
    if (prev.n !== pillN) p.querySelector(".secpill__n")?.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
      { duration: 320, delay: 60, easing: EASE, fill: "backwards" });
  }, [pillSmall, pillTitle, pillN]);
  useEffect(() => {
    const refit = () => fitPill(false);
    document.fonts?.ready.then(refit);
    addEventListener("resize", refit, { passive: true });
    return () => { removeEventListener("resize", refit); pillGhost.current?.remove(); };
  }, []);

  /* review mode */
  useEffect(() => { setReview(isReview(prodHost)); }, [prodHost]);
  useEffect(() => {
    if (!issuesOpen) return;
    const ac = new AbortController();
    addEventListener("keydown", e => { if (e.key === "Escape") setIssuesOpen(false); }, { signal: ac.signal });
    addEventListener("pointerdown", e => { if (!issuesBox.current?.contains(e.target as Node)) setIssuesOpen(false); }, { signal: ac.signal });
    return () => ac.abort();
  }, [issuesOpen]);
  useEffect(() => {
    if (pulse < 0) return;
    const t = setTimeout(() => setPulse(-1), 2400);
    return () => clearTimeout(t);
  }, [pulse]);
  const showIssue = (i: number) => {
    const { items, section } = MENU_ISSUES[i];
    setIssuesOpen(false);
    setPulse(i);
    switchMode("all", false); // the flagged dish may be filtered out
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const dish = items?.[0], rows = [...document.querySelectorAll<HTMLElement>("li[data-k]")];
      const target = dish ? rows.find(li => li.dataset.k!.slice(2) === dish) : section ? document.getElementById(section) : null;
      scrollUnderBar(target ?? null, 60); // a little context above the flagged dish
    }));
  };

  /* The ~300 dish rows only change with the review flags, so the scrollspy, the filter (CSS) and the section sheet
     (which re-render this component) don't re-render the whole menu. */
  const list = useMemo(() => MENU.map(sec => (
    <section key={sec.id} id={sec.id} className="msec" {...DIET_ATTRS.get(sec.id)} style={PHASES.get(sec.id)}>
      <header className="msec__head">
        <small><i className="mphase" aria-hidden="true" />{sec.kicker}</small>
        <h2><SecTitle s={sec} /></h2>
        {review && SECTION_FLAGS.has(sec.id) && (
          <p className={pulse === SECTION_FLAGS.get(sec.id) ? "msec__flag pulse" : "msec__flag"}>
            <i className="flag__q">?</i>{MENU_ISSUES[SECTION_FLAGS.get(sec.id)!].detail}
          </p>
        )}
      </header>
      {sec.groups.map(g => (
        <div className="mgrp" key={g.label} data-t={g.t}>
          {sec.groups.length > 1 && <h3><Veg t={g.t} quiet />{g.label}</h3>}
          <ul className="items">
            {g.items.map(([n, p, note]) => {
              const flags = review ? FLAGS.get(n) : undefined;
              const why = flags?.map(i => MENU_ISSUES[i].detail).join(" ");
              return (
                <li key={n} className={flags ? (flags.includes(pulse) ? "flag pulse" : "flag") : undefined} title={why} data-k={`${g.t}|${n}`}>
                  <Veg t={g.t} />
                  <span className="nm">{n}{flags && <i className="flag__q" aria-label={`Needs confirming: ${why}`}>?</i>}</span>
                  {note && <span className="nt">{note}</span>}
                  <span className="dt" />
                  <span className="pr">{price(p)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  )), [review, pulse]);

  return (
    <>
      <div className="mtools" ref={bar}>
        <div className={thumbOn ? "mfilter has-thumb" : "mfilter"} role="group" aria-label="Show dishes" ref={filt}>
          <span className="mfilter__thumb" ref={thumb} aria-hidden="true" />
          {MODES.map(([m, label]) => (
            <button type="button" key={m} aria-pressed={mode === m} className={`mfilter__${m}`} onClick={() => switchMode(m)}>
              {m !== "all" && <Veg t={m} quiet />}{label}
            </button>
          ))}
        </div>
        <nav className="cats" ref={chips} aria-label="Menu sections">
          {secs.map(s => (
            <button type="button" key={s.id} data-id={s.id} {...DIET_ATTRS.get(s.id)} className={active === s.id ? "on" : undefined} aria-current={active === s.id ? "true" : undefined}
              onClick={() => scrollUnderBar(document.getElementById(s.id))}>
              {s.title}
            </button>
          ))}
        </nav>
      </div>

      <div className="mbody">
        <div className="wrap" ref={body}>
          {list}
          <div className="mnote">
            <span><Veg t="v" quiet /> Veg</span>
            <span><Veg t="n" quiet /> Non-veg</span>
            <span>Prices in ₹</span>
            <span>w/b — with bone · b/l — boneless</span>
            <span>Soft drinks at MRP</span>
          </div>
        </div>
      </div>

      {/* phone: floating section picker + bottom sheet */}
      <button type="button" ref={pillBtn} className={sheet ? "secpill hide" : "secpill"} aria-haspopup="dialog" aria-expanded={sheet} aria-controls="msheet" onClick={() => setSheet(true)}>
        <span className="secpill__moon" style={{ "--p": phase(cur, secs.length) } as React.CSSProperties} aria-hidden="true" />
        <span className="secpill__lbl"><small>{pillSmall}</small><span className="secpill__t"><span>{pillTitle}</span></span></span>
        <span className="secpill__n">{pillN}</span>
      </button>
      <div ref={sheetBg} className={sheet ? "msheet-bg on" : "msheet-bg"} onClick={() => setSheet(false)} aria-hidden="true" />
      <div className={sheet ? "msheet on" : "msheet"} id="msheet" role="dialog" aria-modal="true" aria-label="Menu sections" ref={sheetBox} inert={!sheet} data-lenis-prevent>
        <div className="msheet__head">
          <span className="msheet__grip" aria-hidden="true" />
          <div className="msheet__title"><small>Luna Dine</small>Jump to a section</div>
          <button type="button" className="msheet__top" onClick={() => jump(null)}><IUp />Top</button>
          <button type="button" className="msheet__x" aria-label="Close" onClick={() => setSheet(false)}><IClose /></button>
        </div>
        <div className="msheet__grid">
          {secs.map(s => (
            <button type="button" key={s.id} {...DIET_ATTRS.get(s.id)} className={s.id === active ? "on" : undefined} aria-current={s.id === active ? "true" : undefined} onClick={() => jump(s.id)}>
              <b>{s.title}</b>
              <span>{s.veg && <Veg t="v" quiet />}{s.non && <Veg t="n" quiet />}{s.count} {s.count === 1 ? "dish" : "dishes"}</span>
            </button>
          ))}
        </div>
      </div>

      {review && MENU_ISSUES.length > 0 && (
        <div className="issues" ref={issuesBox}>
          {issuesOpen && (
            <div className="issues__panel" id="menu-issues" role="dialog" aria-label="Menu issues" data-lenis-prevent>
              <div className="issues__head">
                <div>
                  <b>{MENU_ISSUES.length} things to confirm with the owner</b>
                  <span>Review mode only, hidden from customers. Flagged dishes are marked <i className="flag__q">?</i> on the menu.</span>
                </div>
                <button type="button" aria-label="Close" onClick={() => setIssuesOpen(false)}><IClose /></button>
              </div>
              <ol>
                {MENU_ISSUES.map((iss, i) => (
                  <li key={iss.title}>
                    <div>
                      <b>{iss.title}</b>
                      <p>{iss.detail}</p>
                      <small>{iss.source === "card" ? "From the printed card" : "Spotted while reviewing the site"}</small>
                    </div>
                    <button type="button" onClick={() => showIssue(i)}>Show</button>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <button type="button" className="issues__btn" aria-expanded={issuesOpen} aria-controls="menu-issues" onClick={() => setIssuesOpen(o => !o)}>
            <IAlert /><span>Menu issues</span><b>{MENU_ISSUES.length}</b>
          </button>
        </div>
      )}
    </>
  );
}
