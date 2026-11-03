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
const phase = (i: number, n: number) => ({ "--p": (n > 1 ? 0.12 + 0.88 * i / (n - 1) : 1).toFixed(3) }) as React.CSSProperties;

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

/* The chosen filter is remembered for the tab (sessionStorage), so a refresh or Back keeps it. layout.tsx
   reads it before first paint and sets html.diet-v / .diet-n; globals.css then hides the other diet's groups
   (via these data-v / data-n counts) until React renders the filtered menu, so there's no flash or jump. */
const DIET_KEY = "ld-diet";
const DIET_COUNTS = new Map(MENU.map(s => [s.id, {
  "data-v": s.groups.filter(g => g.t !== "n").length, // groups left under Veg
  "data-n": s.groups.filter(g => g.t !== "v").length, // groups left under Non-veg
}]));

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
  const secs = useMemo(() => filterMenu(mode), [mode]);

  const bar = useRef<HTMLDivElement>(null);
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

  /* Switching All / Veg / Non-veg keeps your place. Just before the switch we note the section you're in and the
     first dish under the bar (plus the dishes after it in that section), with their positions on screen. After the
     filtered menu renders, and before it paints, we jump so the first of those dishes that's still shown sits
     exactly where it was. If none is, we go to the start of that section; if the section is gone too, to the
     nearest one that's left. */
  type Anchor = { sec: string; head: number | null; keys: string[]; top: number };
  const anchor = useRef<Anchor | null>(null);
  const capture = (): Anchor | null => {
    const b = body.current;
    if (!b) return null;
    const bar = barH();
    // on phones the current section's title is stuck under the bar, so the reading line is below it
    let line = bar;
    if (matchMedia("(max-width:700px)").matches) {
      const stuck = [...b.querySelectorAll<HTMLElement>(".msec__head")].find(h => { const r = h.getBoundingClientRect(); return r.top <= bar + 1 && r.bottom > bar; });
      if (stuck) line = stuck.getBoundingClientRect().bottom;
    }
    const row = [...b.querySelectorAll<HTMLElement>("li[data-k]")].find(li => li.getBoundingClientRect().bottom > line + 4);
    const sec = row?.closest<HTMLElement>(".msec");
    if (!row || !sec) return null;
    const secTop = sec.getBoundingClientRect().top;
    if (secTop >= bar - 1) return { sec: sec.id, head: secTop, keys: [], top: 0 }; // its title is in view: keep the section put
    const rows = [...sec.querySelectorAll<HTMLElement>("li[data-k]")];
    return { sec: sec.id, head: null, keys: rows.slice(rows.indexOf(row)).map(li => li.dataset.k!), top: row.getBoundingClientRect().top };
  };
  const placeY = (a: Anchor): number | null => {
    const sec = document.getElementById(a.sec);
    if (sec) {
      if (a.head !== null) return docTop(sec) - a.head;
      const rows = new Map([...sec.querySelectorAll<HTMLElement>("li[data-k]")].map(li => [li.dataset.k!, li]));
      const hit = a.keys.map(k => rows.get(k)).find(Boolean);
      return hit ? docTop(hit) - a.top : underBarY(sec);
    }
    const ids = MENU.map(s => s.id), i = ids.indexOf(a.sec);
    const near = [...ids.slice(i + 1), ...ids.slice(0, Math.max(0, i)).reverse()].map(id => document.getElementById(id)).find(Boolean);
    return near ? underBarY(near) : null;
  };
  const switchMode = (m: Mode) => {
    if (m === mode) return;
    anchor.current = capture();
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
      let id = b.querySelector<HTMLElement>(".msec")?.id ?? MENU[0].id;
      b.querySelectorAll<HTMLElement>(".msec").forEach(s => { if (s.getBoundingClientRect().top - line <= 0) id = s.id; });
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

  /* restore the saved filter before paint; the html.diet-* class has covered for it until now */
  const restoring = useRef(false);
  useLayoutEffect(() => {
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(DIET_KEY); } catch {}
    if (saved === "v" || saved === "n") { restoring.current = true; setMode(saved); }
  }, []);
  useLayoutEffect(() => { if (mode !== "all" || !restoring.current) document.documentElement.classList.remove("diet-v", "diet-n"); }, [mode]);

  /* diet filter changed: save it, then keep the reader's place (see capture/placeY above) before the browser paints */
  const firstMode = useRef(true);
  useLayoutEffect(() => {
    if (firstMode.current) { firstMode.current = false; return; }
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
  const list = useMemo(() => secs.map((sec, i) => (
    <section key={sec.id} id={sec.id} className="msec" {...DIET_COUNTS.get(sec.id)}>
      <header className="msec__head">
        <small><i className="mphase" style={phase(i, secs.length)} aria-hidden="true" />{sec.kicker}</small>
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
  )), [secs, review, pulse]);

  return (
    <>
      <div className="mtools" ref={bar}>
        <div className="mfilter" role="group" aria-label="Show dishes">
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
