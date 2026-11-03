"use client";
import { useEffect, useRef, useState } from "react";
import { MENU, type Diet } from "@/lib/menu";
import { MENU_ISSUES } from "@/lib/menu-issues";
import { IAlert, IClose, IUp } from "./Icons";

const Veg = ({ t }: { t: Diet }) => (t === "v" ? <i className="vg" title="Veg" /> : t === "n" ? <i className="vg n" title="Non-veg" /> : null);
const price = (p: number | "MRP") => (typeof p === "number" ? `₹${p}` : p);

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

/* per-section summary for the phone section sheet */
const SECS = MENU.map(s => ({
  id: s.id, title: s.title,
  count: s.groups.reduce((n, g) => n + g.items.length, 0),
  veg: s.groups.some(g => g.t === "v"), non: s.groups.some(g => g.t === "n"),
}));

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

  const bar = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const issuesBox = useRef<HTMLDivElement>(null);
  const sheetBox = useRef<HTMLDivElement>(null);
  const pillBtn = useRef<HTMLButtonElement>(null);

  const barH = () => bar.current?.getBoundingClientRect().height ?? 56;
  const scrollToY = (y: number) => {
    const lenis = window.LD?.lenis;
    lenis ? lenis.scrollTo(y, { duration: 1.1 }) : window.scrollTo({ top: y, behavior: "smooth" });
  };
  /** Scroll so `el` starts just under the sticky chips bar (desktop). On phones there's no bar, but each
   *  section's title is sticky, so a target inside a section is placed under that title instead. */
  const scrollUnderBar = (el: HTMLElement | null, gap = 12) => {
    if (!el) return;
    const bh = barH();
    let off = bh ? bh + gap : 0;
    if (!bh && !el.classList.contains("msec")) off += (el.closest(".msec")?.querySelector<HTMLElement>(".msec__head")?.offsetHeight ?? 0) + gap;
    scrollToY(Math.max(0, docTop(el) - off));
  };

  /* scrollspy: the section crossing the line under the bar is active */
  useEffect(() => {
    let ticking = false;
    const frame = () => {
      ticking = false;
      const b = body.current;
      if (!b) return;
      const line = barH() + 40;
      let id = MENU[0].id;
      b.querySelectorAll<HTMLElement>(".msec").forEach(s => { if (s.getBoundingClientRect().top - line <= 0) id = s.id; });
      setActive(id);
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    addEventListener("scroll", req, { passive: true });
    addEventListener("resize", req, { passive: true });
    frame();
    return () => { removeEventListener("scroll", req); removeEventListener("resize", req); };
  }, []);

  /* keep the active chip in view */
  useEffect(() => {
    const c = bar.current, a = c?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (c && a) c.scrollTo({ left: a.offsetLeft - c.clientWidth / 2 + a.offsetWidth / 2, behavior: "smooth" });
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
  const jump = (id: string | null) => {
    setSheet(false);
    // after the sheet's cleanup has unlocked scrolling
    requestAnimationFrame(() => id ? scrollUnderBar(document.getElementById(id)) : scrollToY(0));
  };
  const cur = SECS.findIndex(s => s.id === active);

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
    const first = iss.items?.[0];
    const target = first
      ? document.querySelector<HTMLElement>(`li[data-n="${CSS.escape(first)}"]`)
      : iss.section ? document.getElementById(iss.section) : null;
    scrollUnderBar(target, 60); // a little context above the flagged dish
  };

  return (
    <>
      <nav className="mtools cats" ref={bar} aria-label="Menu sections">
        {MENU.map(s => (
          <button type="button" key={s.id} data-id={s.id} className={active === s.id ? "on" : undefined} aria-current={active === s.id ? "true" : undefined}
            onClick={() => scrollUnderBar(document.getElementById(s.id))}>
            {s.title}
          </button>
        ))}
      </nav>

      <div className="mbody">
        <div className="wrap" ref={body}>
          {MENU.map(sec => (
            <section key={sec.id} id={sec.id} className="msec">
              <header className="msec__head">
                <small>{sec.kicker}</small>
                <h2>{sec.title}</h2>
                {review && SECTION_FLAGS.has(sec.id) && (
                  <p className={pulse === SECTION_FLAGS.get(sec.id) ? "msec__flag pulse" : "msec__flag"}>
                    <i className="flag__q">?</i>{MENU_ISSUES[SECTION_FLAGS.get(sec.id)!].detail}
                  </p>
                )}
              </header>
              {sec.groups.map(g => (
                <div className="mgrp" key={g.label}>
                  {sec.groups.length > 1 && <h3><Veg t={g.t} />{g.label}</h3>}
                  <ul className="items">
                    {g.items.map(([n, p, note]) => {
                      const flags = review ? FLAGS.get(n) : undefined;
                      const why = flags?.map(i => MENU_ISSUES[i].detail).join(" ");
                      const cls = flags ? (flags.includes(pulse) ? "flag pulse" : "flag") : undefined;
                      return (
                        <li key={n} className={cls} title={why} data-n={flags ? n : undefined}>
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
          ))}
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
        <span className="secpill__ic" aria-hidden="true"><i /><i /><i /><i /></span>
        <span className="secpill__lbl"><small>Sections</small>{SECS[cur]?.title}</span>
        <span className="secpill__n">{cur + 1}/{SECS.length}</span>
      </button>
      <div className={sheet ? "msheet-bg on" : "msheet-bg"} onClick={() => setSheet(false)} aria-hidden="true" />
      <div className={sheet ? "msheet on" : "msheet"} id="msheet" role="dialog" aria-modal="true" aria-label="Menu sections" ref={sheetBox} inert={!sheet} data-lenis-prevent>
        <div className="msheet__head">
          <span className="msheet__grip" aria-hidden="true" />
          <div className="msheet__title"><small>Luna Dine</small>Jump to a section</div>
          <button type="button" className="msheet__top" onClick={() => jump(null)}><IUp />Top</button>
          <button type="button" className="msheet__x" aria-label="Close" onClick={() => setSheet(false)}><IClose /></button>
        </div>
        <div className="msheet__grid">
          {SECS.map(s => (
            <button type="button" key={s.id} className={s.id === active ? "on" : undefined} aria-current={s.id === active ? "true" : undefined} onClick={() => jump(s.id)}>
              <b>{s.title}</b>
              <span>{s.veg && <i className="vg" />}{s.non && <i className="vg n" />}{s.count} {s.count === 1 ? "dish" : "dishes"}</span>
            </button>
          ))}
        </div>
      </div>

      {review && (
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
