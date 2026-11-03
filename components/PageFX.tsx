"use client";
import { useEffect } from "react";

/**
 * Page-level scroll effects. Works on whatever markup the current page has:
 * [data-reveal]/.split reveals, video play-on-screen, lazy map, count-up,
 * story word highlight + moon phase, The Room "step inside" arches, mobile dock.
 */
export default function PageFX({ noIntro = false }: { noIntro?: boolean }) {
  useEffect(() => {
    const d = document, root = d.documentElement;
    if (noIntro) root.classList.add("no-intro");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: (() => void)[] = [];
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const on = <K extends keyof WindowEventMap>(t: K, f: (e: WindowEventMap[K]) => void, o?: AddEventListenerOptions) => {
      addEventListener(t, f, o); cleanups.push(() => removeEventListener(t, f));
    };
    /* reveals */
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -12% 0px" });
    d.querySelectorAll("[data-reveal], .split").forEach(el => io.observe(el));
    cleanups.push(() => io.disconnect());

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

    /* The Room, "step inside": while the stage is pinned, each arch goes from the small frame between the words
       (.portal__gap) to its own place in .portal__arches. Transform and opacity only; sizes are measured on resize
       from layout (offsets ignore transforms), so scrolling never reads layout. */
    const portal = d.querySelector<HTMLElement>(".portal");
    const stage = portal?.querySelector<HTMLElement>(".portal__stage");
    const gap = portal?.querySelector<HTMLElement>(".portal__gap");
    const arches = portal ? [...portal.querySelectorAll<HTMLElement>(".portal__arch")] : [];
    const pimgs = arches.map(a => a.querySelector("img"));
    const halves = portal ? [...portal.querySelectorAll<HTMLElement>(".portal__l, .portal__r")] : [];
    const phead = portal?.querySelector<HTMLElement>(".portal__head");
    const pcap = portal?.querySelector<HTMLElement>(".portal__cap");
    type Box = { x: number; y: number; w: number; h: number };
    let G: Box = { x: 0, y: 0, w: 1, h: 1 }, F: Box[] = [], run = 1, lastE = -1;
    const box = (el: HTMLElement): Box => {
      let x = 0, y = 0;
      for (let e: HTMLElement | null = el; e && e !== stage; e = e.offsetParent as HTMLElement | null) { x += e.offsetLeft; y += e.offsetTop; }
      return { x, y, w: el.offsetWidth, h: el.offsetHeight };
    };
    const measure = () => {
      if (!portal || !stage || !gap) return;
      F = arches.map(box);
      const c = F[1] ?? F[0];
      if (c?.w) gap.style.height = (gap.offsetWidth * c.h / c.w).toFixed(1) + "px"; // same shape as the arch it stands in for
      G = box(gap);
      run = Math.max(1, portal.offsetHeight - stage.offsetHeight);
      lastE = -1;
    };
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const place = (p: number) => {
      if (!portal) return;
      const e = reduce ? 0 : ease(clamp(p / 0.75));
      const k = reduce ? 1 : clamp((p - 0.78) / 0.14);
      if (pcap) { pcap.style.opacity = k.toFixed(3); pcap.style.transform = `translateY(${((1 - k) * 16).toFixed(1)}px)`; }
      if (e === lastE) return;
      lastE = e;
      arches.forEach((a, i) => {
        const f = F[i];
        if (!f?.w) return;
        const s = G.w / f.w + (1 - G.w / f.w) * e;
        const x = (G.x - f.x) * (1 - e), y = (G.y - f.y) * (1 - e);
        a.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})`;
        if (i !== 1) a.style.opacity = clamp((e - 0.08) / 0.3).toFixed(3);
        const im = pimgs[i];
        if (im) im.style.transform = `scale(${(1.25 - 0.25 * e).toFixed(4)})`;
      });
      if (phead) phead.style.opacity = (1 - clamp(e / 0.45)).toFixed(3);
      halves.forEach((h, i) => { h.style.transform = `translateX(${((i ? 1 : -1) * e * 24).toFixed(2)}vw)`; });
      portal.classList.add("on");
    };
    const portalFrame = () => {
      if (!portal) return;
      const r = portal.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) place(clamp(-r.top / run));
    };
    if (portal) {
      measure();
      place(clamp(-portal.getBoundingClientRect().top / run));
      const onResize = () => { measure(); portalFrame(); };
      on("resize", onResize, { passive: true });
      d.fonts?.ready.then(() => { measure(); portalFrame(); }); // the headline's width moves the frame between the words
    }

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
      portalFrame();
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
