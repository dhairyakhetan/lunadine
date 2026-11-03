"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

declare global {
  interface Window { LD?: { lenis: Lenis | null } }
}

/* Last scroll position per page, so Back/Forward return you to where you were (e.g. home → menu → Back). */
const lastY = new Map<string, number>();
let popY: number | null = null; // set by a Back/Forward (popstate) until the new page has been placed
let shown = ""; // the pathname currently on screen

/** Smooth wheel scrolling (desktop) via Lenis. Exposes the instance on window.LD for other components. */
export default function SmoothScroll() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    try { sessionStorage.setItem("ld-intro", "1"); } catch {}
    const onScroll = () => { if (popY === null) lastY.set(location.pathname, scrollY); };
    // Registered before Next's own popstate handler, and the URL has already changed when it runs.
    const onPop = () => { if (location.pathname !== shown) popY = lastY.get(location.pathname) ?? 0; };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("popstate", onPop);
    const off = () => { removeEventListener("scroll", onScroll); removeEventListener("popstate", onPop); };

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { window.LD = { lenis: null }; return off; }
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    window.LD = { lenis };
    let id = 0;
    const raf = (t: number) => { lenis.raf(t); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { off(); cancelAnimationFrame(id); lenis.destroy(); window.LD = { lenis: null }; };
  }, []);

  // On navigation: a new page starts at the top; Back/Forward returns to where you were on that page;
  // a first load or reload keeps the browser's own scroll restoration. An old #hash link still lands on
  // its section, then the hash is removed from the address bar (the site itself never creates #links).
  useEffect(() => {
    const initial = first.current;
    first.current = false;
    shown = pathname;
    document.documentElement.classList.remove("menu-open");
    const t = setTimeout(() => {
      const lenis = window.LD?.lenis;
      lenis?.resize();
      const hash = location.hash;
      const el = hash.length > 1 ? document.querySelector(hash) : null;
      const to = (y: number) => (lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y));
      if (el) lenis ? lenis.scrollTo(el as HTMLElement, { immediate: true }) : el.scrollIntoView();
      else if (popY !== null) to(popY);
      else if (!initial) to(0);
      if (hash) history.replaceState(history.state, "", location.pathname + location.search);
      popY = null;
      lenis?.start();
    }, 30);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
