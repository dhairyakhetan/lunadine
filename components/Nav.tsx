"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE } from "@/lib/site";
import ScrollTo from "./ScrollTo";

/** [to, label]: "/path" is another page; anything else is a section id on this page (a ScrollTo button, never a #link). */
type L = [to: string, label: string];

/** The home page's fixed top bar: frosts once you scroll (html.nav-solid), hides while you scroll down (html.nav-gone),
 *  and below 860px opens a full-screen sheet (html.menu-open). `brand` is the logo link, rendered on the server so
 *  its SVG paths stay out of this bundle. The bar shows the in-page `links` and a "View menu" button; the sheet shows
 *  every link. */
export default function Nav({ brand, links }: { brand: React.ReactNode; links: L[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement, lenis = window.LD?.lenis;
    root.classList.add("menu-open");
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("keydown", onKey);
    return () => { root.classList.remove("menu-open"); lenis?.start(); removeEventListener("keydown", onKey); };
  }, [open]);

  useEffect(() => {
    const root = document.documentElement;
    let lastY = 0, ticking = false;
    const update = () => {
      const y = scrollY;
      root.classList.toggle("nav-solid", y > 40);
      // a scroll event without movement (e.g. dispatched after a layout change) keeps the current state
      if (y !== lastY) root.classList.toggle("nav-gone", y > lastY && y > innerHeight * 0.9 && !root.classList.contains("menu-open"));
      lastY = y; ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => { removeEventListener("scroll", onScroll); root.classList.remove("nav-solid", "nav-gone"); };
  }, []);

  // A plain function, not a component: a component defined in here would remount every link on each render.
  const link = ([to, label]: L, onClick?: () => void) => to.startsWith("/")
    ? <Link key={to} href={to} onClick={onClick}>{label}</Link>
    : <ScrollTo key={to} to={to} onClick={onClick}>{label}</ScrollTo>;

  return (
    <>
      <header className="nav">
        {brand}
        <nav className="nav__links" aria-label="Primary">
          {links.filter(([to]) => !to.startsWith("/")).map(l => link(l))}
          <Link className="btn" href="/menu">View menu</Link>
        </nav>
        <button className="burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <span /><span />
        </button>
      </header>
      <div className="sheet" aria-label="Mobile navigation" aria-hidden={!open}>
        {links.map(l => link(l, () => setOpen(false)))}
        <div className="sheet__foot">
          140/2 Salkia School Road, Howrah 711101<br />
          <a href={SITE.tel}>{SITE.phone}</a>
        </div>
      </div>
    </>
  );
}
