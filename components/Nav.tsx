"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Emblem, Wordmark } from "./Brand";
import { SITE } from "@/lib/site";

type L = { href: string; label: string; current?: boolean };

/** Fixed top bar: frosts on scroll, hides when scrolling down, full-screen sheet on mobile. */
export default function Nav({ links, cta, sheet }: { links: L[]; cta: L; sheet: L[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("menu-open", open);
    const lenis = window.LD?.lenis;
    open ? lenis?.stop() : lenis?.start();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>(".nav")!;
    const root = document.documentElement;
    let lastY = 0, ticking = false;
    const update = () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 40);
      if (y !== lastY) { // a scroll event without movement (e.g. dispatched after a layout change) keeps the current state
        const hide = y > lastY && y > innerHeight * 0.9 && !root.classList.contains("menu-open");
        nav.classList.toggle("is-hidden", hide);
        root.classList.toggle("nav-gone", hide);
      }
      root.style.setProperty("--navh", nav.getBoundingClientRect().height + "px");
      lastY = y; ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => { removeEventListener("scroll", onScroll); root.classList.remove("nav-gone"); };
  }, []);

  const A = ({ l, className, onClick }: { l: L; className?: string; onClick?: () => void }) =>
    l.href.startsWith("#") || l.href.startsWith("tel:") ? (
      <a href={l.href} className={className} onClick={onClick} aria-current={l.current ? "page" : undefined}>{l.label}</a>
    ) : (
      <Link href={l.href} className={className} onClick={onClick} aria-current={l.current ? "page" : undefined}>{l.label}</Link>
    );

  return (
    <>
      <header className="nav">
        <Link className="brand" href="/" aria-label="Luna Dine home">
          <Emblem className="emb" />
          <Wordmark className="wm" label="Luna Dine" />
        </Link>
        <nav className="nav__links" aria-label="Primary">
          {links.map(l => <A key={l.href} l={l} />)}
          <A l={cta} className="btn" />
        </nav>
        <button className="burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <span /><span />
        </button>
      </header>
      <div className="sheet" aria-label="Mobile navigation" aria-hidden={!open}>
        {sheet.map(l => <A key={l.href} l={l} onClick={() => setOpen(false)} />)}
        <div className="sheet__foot">
          140/2 Salkia School Road, Howrah 711101<br />
          <a href={SITE.tel} style={{ font: "inherit", opacity: 1, transform: "none", display: "inline" }}>{SITE.phone}</a>
        </div>
      </div>
    </>
  );
}
