"use client";
import { useEffect } from "react";

/**
 * Page-level scroll effects. Works on whatever markup the current page has:
 * [data-reveal]/.split reveals, pointer glow, video play-on-screen, lazy map, count-up,
 * story word highlight + moon phase, pinned horizontal "room" gallery, dock + back-to-top.
 */
export default function PageFX({ noIntro = false }: { noIntro?: boolean }) {
  useEffect(() => {
    const d = document, root = d.documentElement;
    if (noIntro) root.classList.add("no-intro");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(pointer: fine)").matches;
    const isDesk = () => innerWidth > 860;
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(t: K, f: (e: WindowEventMap[K]) => void, o?: AddEventListenerOptions) => {
      addEventListener(t, f, o); cleanups.push(() => removeEventListener(t, f));
    };
    const scrollToEl = (el: Element | number) => {
      const lenis = window.LD?.lenis;
      if (lenis) lenis.scrollTo(el as HTMLElement | number, { duration: 1.4 });
      else typeof el === "number" ? scrollTo({ top: el, behavior: reduce ? "auto" : "smooth" }) : el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    };

    /* in-page #anchors → smooth scroll */
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")!;
      if (id.length < 2) return;
      const el = d.querySelector(id);
      if (!el) return;
      e.preventDefault();
      root.classList.remove("menu-open");
      window.LD?.lenis?.start();
      scrollToEl(el);
      history.replaceState(null, "", id);
    };
    d.addEventListener("click", onClick);
    cleanups.push(() => d.removeEventListener("click", onClick));

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
      const end = +el.dataset.count!;
      const o = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return; o.disconnect();
        if (reduce) return;
        const t0 = performance.now();
        const step = (t: number) => { const k = Math.min(1, (t - t0) / 1600); el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 4)))); if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      }, { threshold: 0.6 });
      o.observe(el); cleanups.push(() => o.disconnect());
    });

    /* story + moon */
    const story = d.querySelector<HTMLElement>(".story");
    const words = story ? [...story.querySelectorAll<HTMLElement>(".w")] : [];
    const moon = d.querySelector<HTMLElement>(".moon");

    /* room: vertical scroll → horizontal track */
    const room = d.querySelector<HTMLElement>(".room");
    const track = room?.querySelector<HTMLElement>(".room__track") ?? null;
    const cards = room ? [...room.querySelectorAll<HTMLElement>(".card__img img")] : [];
    let roomMax = 0;
    const sizeRoom = () => {
      if (!room || !track) return;
      if (!isDesk()) { room.style.height = ""; track.style.transform = ""; return; }
      roomMax = Math.max(0, track.scrollWidth - innerWidth);
      room.style.height = innerHeight + roomMax + "px";
      window.LD?.lenis?.resize();
    };
    if (track) { const ro = new ResizeObserver(sizeRoom); ro.observe(track); cleanups.push(() => ro.disconnect()); }
    on("resize", sizeRoom, { passive: true });
    sizeRoom();

    const dock = d.querySelector<HTMLElement>(".dock");
    const toTop = d.querySelector<HTMLElement>(".to-top");
    const goTop = () => scrollToEl(0);
    toTop?.addEventListener("click", goTop);
    cleanups.push(() => toTop?.removeEventListener("click", goTop));

    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    let ticking = false;
    const frame = () => {
      const y = scrollY;
      if (story) {
        const r = story.getBoundingClientRect();
        const p = clamp((innerHeight * 0.75 - r.top) / (r.height * 0.62));
        const n = Math.round(p * words.length);
        for (let i = 0; i < words.length; i++) words[i].classList.toggle("on", i < n);
        moon?.style.setProperty("--p", p.toFixed(3));
      }
      if (room && track && isDesk() && roomMax > 0) {
        const r = room.getBoundingClientRect();
        const p = clamp(-r.top / (r.height - innerHeight));
        track.style.transform = `translate3d(${-p * roomMax}px,0,0)`;
        room.style.setProperty("--rp", p.toFixed(4));
        for (const img of cards) {
          const b = img.parentElement!.getBoundingClientRect();
          img.style.setProperty("--px", (((b.left + b.width / 2) / innerWidth - 0.5) * -40).toFixed(1) + "px");
        }
      }
      dock?.classList.toggle("is-on", y > innerHeight * 0.6);
      toTop?.classList.toggle("on", y > innerHeight * 1.2);
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
