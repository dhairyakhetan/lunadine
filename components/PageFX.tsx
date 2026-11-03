"use client";
import { useEffect } from "react";

/**
 * Page-level scroll effects. Works on whatever markup the current page has:
 * [data-reveal]/.split reveals, pointer glow, video play-on-screen, lazy map, count-up,
 * story word highlight + moon phase, mobile dock.
 */
export default function PageFX({ noIntro = false }: { noIntro?: boolean }) {
  useEffect(() => {
    const d = document, root = d.documentElement;
    if (noIntro) root.classList.add("no-intro");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(pointer: fine)").matches;
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(t: K, f: (e: WindowEventMap[K]) => void, o?: AddEventListenerOptions) => {
      addEventListener(t, f, o); cleanups.push(() => removeEventListener(t, f));
    };
    /* reveals */
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -12% 0px" });
    d.querySelectorAll("[data-reveal], .split").forEach(el => io.observe(el));
    cleanups.push(() => io.disconnect());

    /* pointer glow */
    if (fine) {
      const glow = (e: PointerEvent) => {
        const el = (e.target as Element).closest?.(".btn, .dish") as HTMLElement | null;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", e.clientX - r.left + "px");
        el.style.setProperty("--my", e.clientY - r.top + "px");
      };
      d.addEventListener("pointermove", glow, { passive: true });
      cleanups.push(() => d.removeEventListener("pointermove", glow));
    }

    /* video plays only on screen */
    d.querySelectorAll<HTMLVideoElement>("video[data-auto]").forEach(v => {
      if (reduce) { v.pause(); return; }
      const o = new IntersectionObserver(([en]) => { en.isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.05 });
      o.observe(v); cleanups.push(() => o.disconnect());
    });

    /* lazy map */
    d.querySelectorAll<HTMLIFrameElement>("iframe[data-src]").forEach(f => {
      const o = new IntersectionObserver(([en]) => { if (en.isIntersecting) { f.src = f.dataset.src!; o.disconnect(); } }, { rootMargin: "600px" });
      o.observe(f); cleanups.push(() => o.disconnect());
    });

    /* count up */
    d.querySelectorAll<HTMLElement>("[data-count]").forEach(el => {
      if (reduce) return;
      const end = +el.dataset.count!;
      el.textContent = "0"; // the stats fade in before they count, so don't flash the final number first
      const o = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return; o.disconnect();
        let t0 = 0;
        const step = (t: number) => {
          t0 ||= t; // rAF time, not performance.now(): that can be later than the first frame's time and go negative
          const k = Math.min(1, (t - t0) / 1600);
          el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 4))));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: 0.6 });
      o.observe(el); cleanups.push(() => o.disconnect());
    });

    /* story + moon */
    const story = d.querySelector<HTMLElement>(".story");
    const words = story ? [...story.querySelectorAll<HTMLElement>(".w")] : [];
    const moon = d.querySelector<HTMLElement>(".moon");

    const dock = d.querySelector<HTMLElement>(".dock");

    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    let ticking = false;
    const frame = () => {
      const y = scrollY;
      const r = story?.getBoundingClientRect();
      if (story && r && r.bottom > 0 && r.top < innerHeight) { // only while the story is on screen
        const p = clamp((innerHeight * 0.75 - r.top) / (r.height * 0.62));
        const n = Math.round(p * words.length);
        for (let i = 0; i < words.length; i++) words[i].classList.toggle("on", i < n);
        moon?.style.setProperty("--p", p.toFixed(3));
      }
      dock?.classList.toggle("is-on", y > innerHeight * 0.6);
      ticking = false;
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    on("scroll", req, { passive: true });
    on("resize", req, { passive: true });
    frame();

    return () => cleanups.forEach(f => f());
  }, [noIntro]);

  return null;
}
