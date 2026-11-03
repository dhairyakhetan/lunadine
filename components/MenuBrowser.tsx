"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MENU, type Diet } from "@/lib/menu";
import { MENU_ISSUES } from "@/lib/menu-issues";
import { IAlert, IClose, IUp } from "./Icons";

/** Veg / non-veg mark. Labelled for screen readers, except next to a heading that already says it (`quiet`). */
const Veg = ({ t, quiet }: { t: Diet; quiet?: boolean }) => {
  if (t === "x") return null;
  const label = t === "v" ? "Veg" : "Non-veg";
  return <i className={t === "v" ? "vg" : "vg n"} {...(quiet ? { "aria-hidden": true } : { role: "img", "aria-label": label, title: label })} />;
};
const price = (p: number | "MRP") => (typeof p === "number" ? `₹${p}` : p);
/** Moon phase for section i of n: the menu waxes from a thin crescent at the first section to a full moon at the last. */
const phaseOf = (i: number, n: number) => (n > 1 ? 0.12 + 0.88 * i / (n - 1) : 1).toFixed(3);
const phase = (i: number, n: number) => ({ "--p": phaseOf(i, n) }) as React.CSSProperties;

/* Review mode: the "Menu issues" button and inline flags. Off on the production domain unless the
   URL has ?review, so customers never see it; on localhost and preview deploys it's always on. */
const isReview = (prodHost: string) => {
  try {
    return new URLSearchParams(location.search).has("review") || location.hostname !== prodHost;
  } catch { return false; }
};
const FLAGS = new Map<string, number[]>();
MENU_ISSUES.forEach((iss, i) => iss.items?.forEach(n => FLAGS.set(n, [...(FLAGS.get(n) ?? []), i])));
const SECTION_FLAGS = new Map(MENU_ISSUES.flatMap((iss, i) => (iss.section ? [[iss.section, i] as const] : [])));

/* Diet filter. Drinks ("x") are neither veg nor non-veg, so they show in every mode. */
type Mode = "all" | "v" | "n";
const MODES: [Mode, string][] = [["all", "All"], ["v", "Veg"], ["n", "Non-veg"]];
const filterMenu = (mode: Mode) => MENU
  .map(s => ({ ...s, groups: s.groups.filter(g => mode === "all" || g.t === "x" || g.t === mode) }))
  .filter(s => s.groups.length)
  .map(s => ({
    ...s,
    count: s.groups.reduce((n, g) => n + g.items.length, 0),
    veg: s.groups.some(g => g.t === "v"), non: s.groups.some(g => g.t === "n"),
  }));

/* All three menus are worked out once, on arrival. The page renders the full menu a single time, and the filter
   is applied by CSS: html.diet-v / .diet-n hide the other diet's groups, sections, chips and sheet tiles (via
   these data-v / data-n counts and data-t). So a switch re-renders no dish rows, just flips a class, and every
   switch, the first included, costs the same. The choice is remembered for the tab (sessionStorage); layout.tsx
   sets the class before first paint, so a refresh or Back shows the same menu with no flash or jump. */
const DIET_KEY = "ld-diet";
const FILTERED: Record<Mode, ReturnType<typeof filterMenu>> = { all: filterMenu("all"), v: filterMenu("v"), n: filterMenu("n") };
const DIET_COUNTS = new Map(MENU.map(s => [s.id, {
  "data-v": s.groups.filter(g => g.t !== "n").length, // groups left under Veg
  "data-n": s.groups.filter(g => g.t !== "v").length, // groups left under Non-veg
}]));
/* each section's moon phase in each mode (--pa / --pv / --pn); globals.css picks the one for the current filter */
const SEC_PHASE = new Map<string, Record<string, string>>(MENU.map(s => [s.id, {}]));
(["all", "v", "n"] as Mode[]).forEach(m => FILTERED[m].forEach((s, i, a) => { SEC_PHASE.get(s.id)![m === "all" ? "--pa" : `--p${m}`] = phaseOf(i, a.length); }));
const shown = (el: Element) => el.getClientRects().length > 0; // false when the filter hides it

/** Page Y of an element from layout (offsetTop chain), unaffected by transforms. */
const docTop = (el: HTMLElement) => {
  let y = 0;
  for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement | null) y += e.offsetTop;
  return y;
};

/** `prodHost`: the production hostname, resolved on the server at build time (env vars aren't available here). */
export default function MenuBrowser({ prodHost }: { prodHost: string }) {
  const [active, setActive] = useState(MENU[0].id);
  const [review, setReview] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [pulse, setPulse] = useState(-1);
  const [sheet, setSheet] = useState(false);
  const [mode, setMode] = useState<Mode>("all");
  const secs = FILTERED[mode];

  const bar = useRef<HTMLDivElement>(null);
  const filt = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const [thumbOn, setThumbOn] = useState(false);
  const chips = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const issuesBox = useRef<HTMLDivElement>(null);
  const sheetBox = useRef<HTMLDivElement>(null);
  const sheetBg = useRef<HTMLDivElement>(null);
  const pillBtn = useRef<HTMLButtonElement>(null);

  const barH = () => bar.current?.getBoundingClientRect().height ?? 56;
  const scrollToY = (y: number) => {
    const lenis = window.LD?.lenis;
    lenis ? lenis.scrollTo(y, { duration: 1.1 }) : window.scrollTo({ top: y, behavior: "smooth" });
  };
  /** Scroll so `el` starts just under the sticky bar. On phones each section's title is sticky too (under
   *  the bar), so a section lands flush under the bar and anything inside a section lands under its title. */
  const underBarY = (el: HTMLElement, gap = 12) => {
    let off = barH();
    if (!matchMedia("(max-width:700px)").matches) off += gap;
    else if (!el.classList.contains("msec")) off += (el.closest(".msec")?.querySelector<HTMLElement>(".msec__head")?.offsetHeight ?? 0) + gap;
    return Math.max(0, docTop(el) - off);
  };
  const scrollUnderBar = (el: HTMLElement | null, gap = 12) => { if (el) scrollToY(underBarY(el, gap)); };

  /* Switching All / Veg / Non-veg keeps your place. Just before the switch we note the first dish under the bar
     (plus the dishes after it in its section) and where it is on screen. After the class flips, and before the
     browser paints, we jump so the first of those dishes that's still shown sits exactly where it was. If none is,
     we go to the start of that section; if the section is gone too, to the nearest one that's left. */
  type Anchor = { sec: string; head: number | null; keys: string[]; top: number };
  const anchor = useRef<Anchor | null>(null);
  /** On phones, the section title currently stuck under the bar. */
  const stuckHead = () => {
    if (!matchMedia("(max-width:700px)").matches) return null;
    const line = bar.current?.getBoundingClientRect().bottom ?? 0;
    return [...(body.current?.querySelectorAll<HTMLElement>(".msec__head") ?? [])]
      .find(h => { const r = h.getBoundingClientRect(); return r.height > 0 && r.top <= line + 1 && r.bottom > line; }) ?? null;
  };
  /** Top of the part of the screen where dishes scroll: under the bar, and on phones under the stuck section title. */
  const readingLine = () => Math.max(0, stuckHead()?.getBoundingClientRect().bottom ?? bar.current?.getBoundingClientRect().bottom ?? 0);
  const capture = (): Anchor | null => {
    const b = body.current;
    if (!b) return null;
    const line = readingLine(), barBottom = bar.current?.getBoundingClientRect().bottom ?? 0;
    const row = [...b.querySelectorAll<HTMLElement>("li[data-k]")].find(li => shown(li) && li.getBoundingClientRect().bottom > line + 4);
    const sec = row?.closest<HTMLElement>(".msec");
    if (!row || !sec) return null;
    const secTop = sec.getBoundingClientRect().top;
    if (secTop >= barBottom - 1) return { sec: sec.id, head: secTop, keys: [], top: 0 }; // its title is in view: keep the section put
    const rows = [...sec.querySelectorAll<HTMLElement>("li[data-k]")].filter(shown);
    return { sec: sec.id, head: null, keys: rows.slice(rows.indexOf(row)).map(li => li.dataset.k!), top: row.getBoundingClientRect().top };
  };
  const placeY = (a: Anchor): number | null => {
    const sec = document.getElementById(a.sec);
    if (sec && shown(sec)) {
      if (a.head !== null) return docTop(sec) - a.head;
      const rows = new Map([...sec.querySelectorAll<HTMLElement>("li[data-k]")].filter(shown).map(li => [li.dataset.k!, li]));
      const hit = a.keys.map(k => rows.get(k)).find(Boolean);
      return hit ? docTop(hit) - a.top : underBarY(sec);
    }
    const ids = MENU.map(s => s.id), i = ids.indexOf(a.sec);
    const near = [...ids.slice(i + 1), ...ids.slice(0, Math.max(0, i)).reverse()].map(id => document.getElementById(id)).find(el => el && shown(el));
    return near ? underBarY(near) : null;
  };

  /* The switch animates (unless reduced motion). Everything on screen before or after takes part:
     - what stays glides from where it was to where it lands, also when that's off screen, so nothing just vanishes;
     - what leaves squashes flat and fades: a copy of it, drawn where it was, in a layer clipped below the bar that
       keeps up with scrolling;
     - what arrives springs up line by line, its veg / non-veg mark popping in;
     - desktop: each paper card's background (its ::before) stretches or shrinks from its old box to its new one, a
       card that goes away fades behind the menu, and the section chips glide sideways;
     - phones: if a different section's title ends up stuck under the bar, its words fade up.
     Web Animations on transform and opacity only, never React's classes (gotcha 1). A second tap mid-animation
     starts from where things are on screen right then, not from where they were heading. */
  const MOVERS = "li[data-k], .mgrp > h3, .msec__head, .mnote";
  const keyOf = (el: HTMLElement) =>
    el.tagName === "LI" ? el.dataset.k!
      : el.tagName === "H3" ? `g|${el.closest(".msec")?.id}|${el.textContent}`
      : el.classList.contains("mnote") ? "note"
      : el.dataset.id ? `c|${el.dataset.id}`
      : `s|${el.closest(".msec")?.id}`;
  type Box = { x: number; y: number; h: number; vis: boolean };
  type Snap = { pos: Map<string, Box>; cards: Map<string, Box>; seen: { k: string; el: HTMLElement; r: DOMRect }[]; line: number; stuck: string | null };
  const snap = useRef<Snap | null>(null);
  const layers = useRef(new Set<() => void>()); // cleanup for each live layer of copies
  const freezers = useRef(new Set<() => void>()); // stop a layer following the scroll
  const EASE = "cubic-bezier(.22,1,.36,1)";
  const GLIDE = "cubic-bezier(.4,.8,.3,1)"; // starts at 2x its average speed (EASE starts at 4.5x, which reads as a skip)
  const cardsOn = () => matchMedia("(min-width:701px)").matches; // phones have one continuous card instead
  /** our running Web Animations (not CSS transitions, like the moons and the pill, which retarget by themselves) */
  const ourAnims = (root: Element | null) =>
    (root?.getAnimations({ subtree: true }) ?? []).filter(a => !(a instanceof CSSTransition) && !(a instanceof CSSAnimation));
  /** a card's paper as it is on screen right now (its ::before may be mid-animation: translateY + scaleY from the top) */
  const cardBox = (el: HTMLElement, line: number): Box => {
    const r = el.getBoundingClientRect();
    const m = getComputedStyle(el, "::before").transform.match(/matrix\(([^)]+)\)/)?.[1].split(",").map(Number);
    const y = r.top + (m ? m[5] : 0), h = r.height * (m ? m[3] : 1);
    return { x: r.left, y, h, vis: y + h > line && y < innerHeight };
  };
  const snapshot = (): Snap | null => {
    const b = body.current;
    if (!b || matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
    const line = readingLine(), vh = innerHeight, stuck = stuckHead();
    const pos = new Map<string, Box>(), cards = new Map<string, Box>(), seen: Snap["seen"] = [];
    const take = (el: HTMLElement, visible: (r: DOMRect) => boolean) => {
      if (!shown(el) || el === stuck) return;
      const r = el.getBoundingClientRect(), k = keyOf(el), vis = visible(r); // on-screen rects, mid-animation included
      pos.set(k, { x: r.left, y: r.top, h: r.height, vis });
      if (vis) seen.push({ k, el, r });
    };
    b.querySelectorAll<HTMLElement>(MOVERS).forEach(el => take(el, r => r.bottom > line && r.top < vh));
    const c = chips.current, cr = c?.getBoundingClientRect();
    c?.querySelectorAll<HTMLElement>(":scope > button").forEach(el => take(el, r => !!cr && r.right > cr.left && r.left < cr.right));
    if (cardsOn()) b.querySelectorAll<HTMLElement>(".msec").forEach(el => { if (shown(el)) cards.set(el.id, cardBox(el, line)); });
    // that's the screen as it is; now drop running animations so the new ones start from exactly here
    [...ourAnims(b), ...ourAnims(bar.current)].forEach(a => a.cancel());
    return { pos, cards, seen, line, stuck: stuck?.closest(".msec")?.id ?? null };
  };

  /** A layer for copies of what left, clipped to the reading area. It keeps up with any scrolling while they fade,
   *  so they don't drift. `behind` puts it under the menu (for card backgrounds). */
  const ghostLayer = (top: number, behind: boolean) => {
    const outer = document.createElement("div"), inner = document.createElement("div");
    outer.className = behind ? "mghosts mghosts--back" : "mghosts";
    outer.style.top = top + "px";
    inner.style.cssText = "position:absolute;left:0;right:0;top:0;bottom:0";
    outer.appendChild(inner);
    document.body.appendChild(outer);
    const y0 = scrollY;
    const follow = () => { inner.style.transform = `translateY(${y0 - scrollY}px)`; };
    addEventListener("scroll", follow, { passive: true });
    const freeze = () => { removeEventListener("scroll", follow); freezers.current.delete(freeze); };
    const done = () => { freeze(); outer.remove(); layers.current.delete(done); };
    layers.current.add(done);
    freezers.current.add(freeze);
    setTimeout(done, 450);
    return { inner, top };
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
    const move = (el: HTMLElement, visible: (r: DOMRect) => boolean) => {
      if (!shown(el) || el === stuck) return;
      const k = keyOf(el), r = el.getBoundingClientRect(), o = sn.pos.get(k), vis = visible(r);
      const reach = o?.vis && vis ? near : near * 0.55; // coming from (or going) off screen: a shorter sweep
      if (o && (o.vis || vis) && Math.abs(o.y - r.top) <= reach) {
        staying.add(k);
        const dx = o.x - r.left, dy = o.y - r.top;
        if (Math.abs(dx) + Math.abs(dy) >= 1) glide(el, dx, dy);
      } else {
        if (!o?.vis) staying.add(k); // wasn't on screen: nothing to take away
        if (vis) enter(el);
      }
    };
    b.querySelectorAll<HTMLElement>(MOVERS).forEach(el => move(el, r => r.bottom > line - 40 && r.top < vh));
    const c = chips.current, cr = c?.getBoundingClientRect();
    c?.querySelectorAll<HTMLElement>(":scope > button").forEach(el => move(el, r => !!cr && r.right > cr.left && r.left < cr.right));
    // phones: a different section's title is now stuck under the bar: its words fade up
    if (stuck && stuck.closest(".msec")?.id !== sn.stuck) [...stuck.children].forEach(ch => enter(ch as HTMLElement));

    // desktop: paper cards stretch or shrink from their old box to the new one; one that went away fades out behind
    const gonecards: Box[] = [];
    if (cardsOn()) {
      const ids = new Set<string>();
      b.querySelectorAll<HTMLElement>(".msec").forEach(el => {
        if (!shown(el)) return;
        ids.add(el.id);
        const r = el.getBoundingClientRect(), o = sn.cards.get(el.id), vis = r.bottom > line && r.top < vh;
        if (o && (o.vis || vis)) {
          const dy = o.y - r.top, sy = o.h / Math.max(1, r.height);
          if (Math.abs(dy) >= 1 || Math.abs(sy - 1) > 0.002) el.animate([
            { transform: `translateY(${dy}px) scaleY(${sy.toFixed(4)})`, transformOrigin: "50% 0" },
            { transform: "none", transformOrigin: "50% 0" },
          ], { duration: 560, delay: 80, easing: GLIDE, fill: "backwards", pseudoElement: "::before" });
        } else if (vis) el.animate([
          { opacity: 0, transform: "scaleY(.92)", transformOrigin: "50% 0" },
          { opacity: 1, transform: "none", transformOrigin: "50% 0" },
        ], { duration: 420, delay: 80, easing: EASE, fill: "backwards", pseudoElement: "::before" });
      });
      sn.cards.forEach((o, id) => { if (!ids.has(id) && o.vis) gonecards.push(o); });
    }

    // what left: copies where they were, squashing out
    const gone = sn.seen.filter(g => !staying.has(g.k) && !g.k.startsWith("c|")); // chips just make room as the row glides
    if (gone.length) {
      const { inner, top } = ghostLayer(sn.line, false);
      gone.forEach((g, i) => {
        const wrap = document.createElement(g.el.tagName === "LI" ? "ul" : "div");
        wrap.className = g.el.tagName === "LI" ? "items" : g.el.tagName === "H3" ? "mgrp" : "";
        wrap.style.cssText = `position:absolute;left:${g.r.left}px;top:${g.r.top - top}px;width:${g.r.width}px;margin:0;padding:0;columns:auto`;
        const copy = g.el.cloneNode(true) as HTMLElement;
        if (copy.classList.contains("msec__head")) {
          copy.style.position = "static";
          const m = g.el.querySelector(".mphase"), mc = copy.querySelector<HTMLElement>(".mphase");
          if (m && mc) mc.style.setProperty("--p", getComputedStyle(m).getPropertyValue("--p")); // keep its moon
        }
        wrap.appendChild(copy);
        inner.appendChild(wrap);
        copy.animate([
          { opacity: 1, transform: "none", transformOrigin: "0 50%" },
          { opacity: 0, transform: "scale(.97,.25)", transformOrigin: "0 50%" },
        ], { duration: 200, delay: Math.min(i * 8, 48), easing: "cubic-bezier(.55,0,1,.45)", fill: "forwards" });
      });
    }
    if (gonecards.length) {
      const { inner, top } = ghostLayer(sn.line, true), w = b.getBoundingClientRect();
      gonecards.forEach(o => {
        const card = document.createElement("div");
        card.className = "mghost-card";
        card.style.cssText = `left:${w.left}px;top:${o.y - top}px;width:${w.width}px;height:${o.h}px`;
        inner.appendChild(card);
        card.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.98,.6)" }],
          { duration: 260, easing: "cubic-bezier(.55,0,1,.45)", fill: "forwards" });
      });
    }
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
  const thumbPlaced = useRef(false);
  useLayoutEffect(() => {
    placeThumb(thumbPlaced.current && !matchMedia("(prefers-reduced-motion: reduce)").matches);
    thumbPlaced.current = true;
    setThumbOn(true);
  }, [mode]);
  useEffect(() => {
    const g = filt.current, all = layers.current;
    if (!g) return;
    const ro = new ResizeObserver(() => placeThumb(false));
    ro.observe(g);
    g.querySelectorAll("button").forEach(btn => ro.observe(btn));
    return () => { ro.disconnect(); all.forEach(done => done()); };
  }, []);

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    anchor.current = capture(); // first: it reads where things are on screen, before running animations are dropped
    snap.current = snapshot();
    // copies still fading from a quick earlier tap stay where they are on screen: the re-anchoring scroll that's
    // about to happen keeps the menu in place on screen too, so they mustn't follow it
    [...freezers.current].forEach(f => f());
    setMode(m);
  };

  /* scrollspy: the section crossing the line under the bar is active */
  useEffect(() => {
    let ticking = false;
    const frame = () => {
      ticking = false;
      const b = body.current;
      if (!b) return;
      const line = barH() + 40;
      const all = [...b.querySelectorAll<HTMLElement>(".msec")].filter(shown); // sections hidden by the filter don't count
      let id = all[0]?.id ?? MENU[0].id;
      all.forEach(s => { if (s.getBoundingClientRect().top - line <= 0) id = s.id; });
      setActive(id);
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    addEventListener("scroll", req, { passive: true });
    addEventListener("resize", req, { passive: true });
    frame();
    return () => { removeEventListener("scroll", req); removeEventListener("resize", req); };
  }, []);

  /* chips row: fade an edge only while there are more chips hidden past it (so at the start, the first chip sits clean) */
  useEffect(() => {
    const c = chips.current;
    if (!c) return;
    const upd = () => {
      const max = c.scrollWidth - c.clientWidth;
      c.style.setProperty("--fl", c.scrollLeft > 2 ? "28px" : "0px");
      c.style.setProperty("--fr", c.scrollLeft < max - 2 ? "28px" : "0px");
    };
    upd();
    c.addEventListener("scroll", upd, { passive: true });
    addEventListener("resize", upd, { passive: true });
    return () => { c.removeEventListener("scroll", upd); removeEventListener("resize", upd); };
  }, [secs]);

  /* keep the active chip in view */
  useEffect(() => {
    const c = chips.current, a = c?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!c || !a) return;
    // measured against the row itself (offsetLeft would count from the sticky bar and include the filter's width)
    const cr = c.getBoundingClientRect(), ar = a.getBoundingClientRect();
    c.scrollTo({ left: c.scrollLeft + ar.left - cr.left - (cr.width - ar.width) / 2, behavior: "smooth" });
  }, [active]);

  /* phone section sheet: lock the page behind it, close on Escape, move focus in and back out */
  useEffect(() => {
    if (!sheet) return;
    const root = document.documentElement, lenis = window.LD?.lenis;
    root.style.overflow = "hidden";
    lenis?.stop();
    const g = sheetBox.current;
    (g?.querySelector<HTMLElement>(".msheet__grid .on") ?? g?.querySelector<HTMLElement>(".msheet__grid button"))?.focus({ preventScroll: true });
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
    const down = (e: PointerEvent) => {
      if (!e.isPrimary || (e.target as Element).closest("button")) return;
      id = e.pointerId; y0 = e.clientY; dy = 0; t = e.timeStamp; v = 0;
      head.setPointerCapture(id);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      const d = Math.max(0, e.clientY - y0);
      v = 0.7 * ((d - dy) / Math.max(1, e.timeStamp - t)) + 0.3 * v;
      dy = d; t = e.timeStamp;
      set(`translateY(${dy}px)`, String(1 - Math.min(1, dy / box.offsetHeight)), "none");
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      set("", "", ""); // back to the stylesheet: it slides home, or out if we close it below
      const fast = dy > 24 && v > 0.4 && e.timeStamp - t < 120; // a flick (still moving when let go)
      if (dy > Math.min(120, box.offsetHeight * 0.25) || fast) setSheet(false);
    };
    head.addEventListener("pointerdown", down);
    head.addEventListener("pointermove", move);
    head.addEventListener("pointerup", up);
    head.addEventListener("pointercancel", up);
    return () => {
      head.removeEventListener("pointerdown", down);
      head.removeEventListener("pointermove", move);
      head.removeEventListener("pointerup", up);
      head.removeEventListener("pointercancel", up);
    };
  }, []);
  const jump = (id: string | null) => {
    setSheet(false);
    // after the sheet's cleanup has unlocked scrolling
    requestAnimationFrame(() => id ? scrollUnderBar(document.getElementById(id)) : scrollToY(0));
  };
  const cur = Math.max(0, secs.findIndex(s => s.id === active));

  /* restore the saved filter before paint (the html.diet-* class from layout.tsx already shows that menu) */
  const restoring = useRef(false);
  useLayoutEffect(() => {
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(DIET_KEY); } catch {}
    if (saved === "v" || saved === "n") { restoring.current = true; setMode(saved); }
  }, []);

  /* diet filter changed: save it, then keep the reader's place (see capture/placeY above) before the browser paints */
  const firstMode = useRef(true);
  useLayoutEffect(() => {
    if (firstMode.current) { firstMode.current = false; return; } // the class from layout.tsx is already right
    const root = document.documentElement;
    root.classList.toggle("diet-v", mode === "v");
    root.classList.toggle("diet-n", mode === "n");
    try { mode === "all" ? sessionStorage.removeItem(DIET_KEY) : sessionStorage.setItem(DIET_KEY, mode); } catch {}
    const lenis = window.LD?.lenis;
    lenis?.resize();
    if (restoring.current) { restoring.current = false; dispatchEvent(new Event("scroll")); return; } // a refresh: stay put
    const a = anchor.current;
    anchor.current = null;
    const y = a && placeY(a);
    if (y !== null && y !== undefined) {
      const top = Math.max(0, Math.round(y));
      lenis ? lenis.scrollTo(top, { immediate: true, force: true }) : window.scrollTo(0, top);
    }
    const sn = snap.current;
    snap.current = null;
    if (sn) animateSwitch(sn); // after the scroll is restored, so old and new places are both screen positions
    dispatchEvent(new Event("scroll"));
  }, [mode]);

  /* review mode */
  useEffect(() => { setReview(isReview(prodHost)); }, [prodHost]);
  useEffect(() => {
    if (!issuesOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIssuesOpen(false); };
    const onDown = (e: PointerEvent) => { if (!issuesBox.current?.contains(e.target as Node)) setIssuesOpen(false); };
    addEventListener("keydown", onKey);
    addEventListener("pointerdown", onDown);
    return () => { removeEventListener("keydown", onKey); removeEventListener("pointerdown", onDown); };
  }, [issuesOpen]);
  useEffect(() => {
    if (pulse < 0) return;
    const t = setTimeout(() => setPulse(-1), 2400);
    return () => clearTimeout(t);
  }, [pulse]);

  const showIssue = (i: number) => {
    const iss = MENU_ISSUES[i];
    setIssuesOpen(false);
    setPulse(i);
    setMode("all"); // the flagged dish may be filtered out
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const first = iss.items?.[0];
      const target = first
        ? document.querySelector<HTMLElement>(`li[data-n="${CSS.escape(first)}"]`)
        : iss.section ? document.getElementById(iss.section) : null;
      scrollUnderBar(target, 60); // a little context above the flagged dish
    }));
  };

  /* The ~300 dish rows only change with the filter or review flags, so scrollspy updates and opening the
     section sheet (which re-render this component) don't re-render the whole menu. */
  const list = useMemo(() => FILTERED.all.map(sec => (
    <section key={sec.id} id={sec.id} className="msec" {...DIET_COUNTS.get(sec.id)} style={SEC_PHASE.get(sec.id) as React.CSSProperties}>
      <header className="msec__head">
        <small><i className="mphase" aria-hidden="true" />{sec.kicker}</small>
        <h2>{sec.title}</h2>
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
              const cls = flags ? (flags.includes(pulse) ? "flag pulse" : "flag") : undefined;
              return (
                <li key={n} className={cls} title={why} data-k={`${g.t}|${n}`} data-n={flags ? n : undefined}>
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
  )), [review, pulse]); // not the filter: CSS applies that

  return (
    <>
      <div className="mtools" ref={bar}>
        <div className={thumbOn ? "mfilter has-thumb" : "mfilter"} role="group" aria-label="Show dishes" ref={filt}>
          <span className="mfilter__thumb" ref={thumb} aria-hidden="true" />
          {MODES.map(([m, label]) => (
            <button type="button" key={m} aria-pressed={mode === m} className={`mfilter__${m}`} onClick={() => switchMode(m)}>
              {m === "v" && <i className="vg" />}{m === "n" && <i className="vg n" />}{label}
            </button>
          ))}
        </div>
        <nav className="cats" ref={chips} aria-label="Menu sections">
          {secs.map(s => (
            <button type="button" key={s.id} data-id={s.id} {...DIET_COUNTS.get(s.id)} className={active === s.id ? "on" : undefined} aria-current={active === s.id ? "true" : undefined}
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
            <span><i className="vg" /> Veg</span>
            <span><i className="vg n" /> Non-veg</span>
            <span>Prices in ₹</span>
            <span>w/b — with bone · b/l — boneless</span>
            <span>Soft drinks at MRP</span>
          </div>
        </div>
      </div>

      {/* phone: floating section picker + bottom sheet */}
      <button type="button" ref={pillBtn} className={sheet ? "secpill hide" : "secpill"} aria-haspopup="dialog" aria-expanded={sheet} aria-controls="msheet" onClick={() => setSheet(true)}>
        <span className="secpill__moon" style={phase(cur, secs.length)} aria-hidden="true" />
        <span className="secpill__lbl"><small>{mode === "v" ? "Veg · sections" : mode === "n" ? "Non-veg · sections" : "Sections"}</small>{secs[cur]?.title}</span>
        <span className="secpill__n">{cur + 1}/{secs.length}</span>
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
            <button type="button" key={s.id} {...DIET_COUNTS.get(s.id)} className={s.id === active ? "on" : undefined} aria-current={s.id === active ? "true" : undefined} onClick={() => jump(s.id)}>
              <b>{s.title}</b>
              <span>{s.veg && <i className="vg" />}{s.non && <i className="vg n" />}{s.count} {s.count === 1 ? "dish" : "dishes"}</span>
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
