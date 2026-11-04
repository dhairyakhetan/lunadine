"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { jumpToY, reducedMotion } from "@/lib/scroll";

declare global {
  interface Window { LD?: { lenis: Lenis | null } }
}

/* Last scroll position per page, so Back/Forward return you to where you were (e.g. home → menu → Back). */
const lastY = new Map<string, number>();
let popY: number | null = null; // set by a Back/Forward (popstate) until the new page has been placed
let shown = ""; // the pathname currently on screen

/** Mounted once, in the root layout, so it lives across page navigations. Smooth wheel scrolling via Lenis
 *  (window.LD.lenis; null under reduced motion), scroll placement on navigation, and the intro played only once. */
export default function SmoothScroll() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    try { sessionStorage.setItem("ld-intro", "1"); } catch {} // layout.tsx skips the intro on this tab's next loads
    const onScroll = () => { if (popY === null) lastY.set(location.pathname, scrollY); };
    // Registered before Next's own popstate handler, and the URL has already changed when it runs.
    const onPop = () => { if (location.pathname !== shown) popY = lastY.get(location.pathname) ?? 0; };
    const ac = new AbortController();
    addEventListener("scroll", onScroll, { passive: true, signal: ac.signal });
    addEventListener("popstate", onPop, { signal: ac.signal });
    const lenis = reducedMotion() ? null : new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: true });
    window.LD = { lenis };
    return () => { ac.abort(); lenis?.destroy(); window.LD = { lenis: null }; };
  }, []);

  // On navigation: a new page starts at the top; Back/Forward returns to where you were on that page;
  // a first load or reload keeps the browser's own scroll restoration. An old #hash link still lands on
  // its section, then the hash is removed from the address bar (the site itself never creates #links).
  useEffect(() => {
    const initial = first.current;
    first.current = false;
    shown = pathname;
    if (!initial) document.documentElement.classList.add("no-intro"); // so coming back home doesn't replay it
    const t = setTimeout(() => {
      window.LD?.lenis?.resize();
      const { hash } = location, el = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
      if (el) el.scrollIntoView(); // honours the target's scroll-margin-top
      else if (popY !== null) jumpToY(popY);
      else if (!initial) jumpToY(0);
      if (hash) history.replaceState(history.state, "", location.pathname + location.search);
      popY = null;
    }, 30);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
