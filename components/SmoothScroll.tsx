"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

declare global {
  interface Window { LD?: { lenis: Lenis | null } }
}

/** Smooth wheel scrolling (desktop) via Lenis. Exposes the instance on window.LD for other components. */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    try { sessionStorage.setItem("ld-intro", "1"); } catch {}
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { window.LD = { lenis: null }; return; }
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    window.LD = { lenis };
    let id = 0;
    const raf = (t: number) => { lenis.raf(t); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); window.LD = { lenis: null }; };
  }, []);

  // On client-side navigation: jump to top, or to the #hash target.
  useEffect(() => {
    const lenis = window.LD?.lenis;
    document.documentElement.classList.remove("menu-open");
    const t = setTimeout(() => {
      lenis?.resize();
      const hash = location.hash;
      const el = hash.length > 1 ? document.querySelector(hash) : null;
      if (el) lenis ? lenis.scrollTo(el as HTMLElement, { immediate: true }) : el.scrollIntoView();
      else lenis ? lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0);
      lenis?.start();
    }, 30);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
