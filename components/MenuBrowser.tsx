"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MENU, type Diet } from "@/lib/menu";
import { Corner, Ornament } from "./Brand";
import { ISearch, IDownload } from "./Icons";

type Mode = "all" | "v" | "n";

const Veg = ({ t }: { t: Diet }) => (t === "v" ? <i className="vg" title="Veg" /> : t === "n" ? <i className="vg n" title="Non-veg" /> : null);
const price = (p: number | "MRP") => (typeof p === "number" ? `₹${p}` : p);

function Hi({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

export default function MenuBrowser() {
  const [raw, setRaw] = useState("");
  const [mode, setMode] = useState<Mode>("all");
  const [active, setActive] = useState(MENU[0].id);
  const [stuck, setStuck] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const q = raw.trim().toLowerCase();

  const tools = useRef<HTMLDivElement>(null);
  const cats = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const segBtns = useRef<Record<Mode, HTMLButtonElement | null>>({ all: null, v: null, n: null });

  const filtered = useMemo(() => MENU.map(sec => {
    const groups = sec.groups
      .filter(g => mode === "all" || g.t === mode)
      .map(g => ({ ...g, items: g.items.filter(([n]) => !q || n.toLowerCase().includes(q)) }))
      .filter(g => g.items.length);
    return { ...sec, groups, count: groups.reduce((n, g) => n + g.items.length, 0) };
  }), [q, mode]);
  const shown = filtered.reduce((n, s) => n + s.count, 0);
  const filtering = !!q || mode !== "all";

  const toolH = () => tools.current?.getBoundingClientRect().height ?? 140;
  const navH = () => document.querySelector(".nav")?.getBoundingClientRect().height ?? 64;
  /** Page Y where the toolbar starts sticking. Measured from .mbody, because the toolbar's own
   *  rect includes its `.stuck` translateY (it slides under the nav), which would read as "not pinned". */
  const pinY = () => (body.current?.parentElement?.getBoundingClientRect().top ?? 0) + scrollY - toolH();
  const isPinned = () => pinY() - scrollY <= 0.5;
  /** Scroll target that puts page-Y `docY` just under the pinned toolbar, allowing for the nav,
   *  which hides when scrolling down past 90vh and comes back when scrolling up (see Nav). */
  const underBar = (docY: number, gap = 16) => {
    const th = toolH(), nh = navH();
    const navHidden = docY - th - gap;
    if (navHidden > scrollY && navHidden > innerHeight * 0.9) return navHidden;
    const y = docY - th - nh - gap, pin = pinY();
    return y >= pin ? y : Math.max(0, pin - nh); // not pinned there: rest the toolbar just under the nav
  };
  const scrollToY = (y: number, dur = 1.3) => {
    const lenis = window.LD?.lenis;
    lenis ? lenis.scrollTo(y, { duration: dur }) : window.scrollTo({ top: y, behavior: "smooth" });
  };
  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) scrollToY(underBar(el.getBoundingClientRect().top + scrollY));
  };

  /* veg / non-veg pill */
  useLayoutEffect(() => {
    const move = () => {
      const b = segBtns.current[mode], p = pill.current;
      if (b && p) { p.style.width = b.offsetWidth + "px"; p.style.transform = `translateX(${b.offsetLeft}px)`; }
      document.documentElement.style.setProperty("--toolh", toolH() + "px");
    };
    move();
    document.fonts?.ready.then(move);
    addEventListener("resize", move);
    return () => removeEventListener("resize", move);
  }, [mode]);

  /* reveal sections as they enter */
  useEffect(() => {
    const io = new IntersectionObserver(es => {
      const ids = es.filter(e => e.isIntersecting).map(e => (e.target as HTMLElement).id);
      if (ids.length) setSeen(s => { const n = new Set(s); ids.forEach(i => n.add(i)); return n; });
    }, { rootMargin: "0px 0px -8% 0px" });
    body.current?.querySelectorAll(".msec").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* scrollspy, progress bar, sticky state */
  useEffect(() => {
    let ticking = false;
    const frame = () => {
      ticking = false;
      const t = tools.current, b = body.current;
      if (!t || !b) return;
      const line = t.getBoundingClientRect().bottom + 40; // visual bottom: includes the slide under the nav
      let id = "";
      b.querySelectorAll<HTMLElement>(".msec:not([hidden])").forEach(s => { if (s.getBoundingClientRect().top - line <= 0) id = s.id; });
      if (!id) id = b.querySelector<HTMLElement>(".msec:not([hidden])")?.id ?? "";
      setActive(id);
      const r = b.getBoundingClientRect();
      const pl = toolH() + 40;
      t.style.setProperty("--mp", Math.min(1, Math.max(0, (pl - r.top) / (r.height - innerHeight + pl))).toFixed(4));
      setStuck(isPinned());
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    addEventListener("scroll", req, { passive: true });
    addEventListener("resize", req, { passive: true });
    frame();
    return () => { removeEventListener("scroll", req); removeEventListener("resize", req); };
  }, []);

  /* keep the active chip centred */
  useEffect(() => {
    const c = cats.current, a = c?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (c && a) c.scrollTo({ left: a.offsetLeft - c.clientWidth / 2 + a.offsetWidth / 2, behavior: "smooth" });
  }, [active]);

  /* "/" focuses search; content height changes → tell Lenis */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "/" && document.activeElement !== input.current) { e.preventDefault(); input.current?.focus(); } };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const lenis = window.LD?.lenis;
    lenis?.resize();
    // If the toolbar is pinned, jump so the (now shorter) results start right under it.
    const b = body.current;
    if (b && isPinned()) {
      const y = underBar(b.getBoundingClientRect().top + scrollY);
      lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y);
    }
    dispatchEvent(new Event("scroll"));
  }, [q, mode]);

  const onFocus = () => {
    const top = tools.current?.getBoundingClientRect().top ?? 0;
    if (top > 2) scrollToY(scrollY + top, 0.8);
  };

  return (
    <>
      <div className={stuck ? "mtools stuck" : "mtools"} ref={tools}>
        <div className="wrap">
          <div className="mtools__row">
            <label className="search">
              <span className="sr-only">Search the menu</span>
              <ISearch />
              <input
                ref={input} id="q" type="search" value={raw} autoComplete="off" enterKeyHint="search"
                placeholder="Search — try “biryani”, “paneer”, “mojito”"
                onChange={e => setRaw(e.target.value)} onFocus={onFocus}
                onKeyDown={e => { if (e.key === "Escape") { setRaw(""); input.current?.blur(); } }}
              />
              <kbd>/</kbd>
            </label>
            <div className="seg" role="group" aria-label="Diet filter">
              <span className="seg__pill" ref={pill} aria-hidden="true" />
              {([["all", "All"], ["v", "Veg"], ["n", "Non-veg"]] as [Mode, string][]).map(([m, label]) => (
                <button key={m} type="button" aria-pressed={mode === m} ref={el => { segBtns.current[m] = el; }} onClick={() => setMode(m)}>
                  {m !== "all" && <Veg t={m} />}{label}
                </button>
              ))}
            </div>
            <a className="mtools__pdf" href="/luna-dine-menu.pdf" download><IDownload /><span>PDF menu</span></a>
          </div>
        </div>
        <nav className="cats wrap" ref={cats} aria-label="Menu sections">
          {filtered.map(s => (
            <a key={s.id} href={`#${s.id}`} data-id={s.id}
              className={[active === s.id && "on", !s.count && "empty"].filter(Boolean).join(" ") || undefined}
              onClick={e => { e.preventDefault(); e.stopPropagation(); goTo(s.id); }}>
              {s.title}
            </a>
          ))}
        </nav>
        <span className="mprog" aria-hidden="true" />
      </div>

      <div className="mbody">
        <div className="wrap" ref={body}>
          {filtered.map(sec => (
            <section key={sec.id} id={sec.id} hidden={!sec.count} className={seen.has(sec.id) || filtering ? "msec is-in" : "msec"}>
              <span className="msec__corner tl"><Corner /></span>
              <span className="msec__corner br"><Corner /></span>
              <header className="msec__head">
                <small>{sec.kicker}</small>
                <h2>{sec.title}</h2>
                <div className="ornament"><Ornament /></div>
              </header>
              {sec.groups.map(g => (
                <div className="mgrp" key={g.label}>
                  <h3><Veg t={g.t} />{g.label}<span className="ct">{g.items.length}</span></h3>
                  <ul className="items">
                    {g.items.map(([n, p, note]) => (
                      <li key={n}>
                        <Veg t={g.t} />
                        <span className="nm"><Hi text={n} q={q} /></span>
                        {note && <span className="nt">{note}</span>}
                        <span className="dt" />
                        <span className="pr">{price(p)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
          <div className={shown ? "mempty" : "mempty on"}>
            <b>Nothing under that moon.</b>Try another word — or call us, we might just make it.
          </div>
          <div className="mnote">
            <span><i className="vg" /> Veg</span>
            <span><i className="vg n" /> Non-veg</span>
            <span>Prices in ₹</span>
            <span>w/b — with bone · b/l — boneless</span>
            <span>Soft drinks at MRP</span>
          </div>
        </div>
      </div>
    </>
  );
}
