"use client";
import { useEffect } from "react";
import { reducedMotion } from "@/lib/scroll";

/**
 * The home page's scroll effects, run on its server-rendered markup (app/page.tsx): [data-reveal] / .split reveals,
 * signature dishes lit on touch screens, the hero video playing only on screen, the lazy map, the count-up stats,
 * the story's words and moon, The Room's "step inside" arches, and the phone dock. Cleans up on unmount.
 */
export default function PageFX() {
  useEffect(() => {
    const d = document, reduce = reducedMotion(), ac = new AbortController(), observers: IntersectionObserver[] = [];
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    /** call `fn` as each element matching `sel` enters or leaves the viewport (as `opts` sets it) */
    const watch = (sel: string, fn: (el: HTMLElement, on: boolean, io: IntersectionObserver) => void, opts?: IntersectionObserverInit) => {
      const io = new IntersectionObserver(es => es.forEach(en => fn(en.target as HTMLElement, en.isIntersecting, io)), opts);
      d.querySelectorAll(sel).forEach(el => io.observe(el));
      observers.push(io);
    };

    watch("[data-reveal], .split", (el, on, io) => { if (on) { el.classList.add("is-in"); io.unobserve(el); } }, { rootMargin: "0px 0px -12% 0px" });
    // touch screens have no hover: the signature dish passing through the middle of the screen lights up instead
    if (matchMedia("(hover: none)").matches) watch(".dish", (el, on) => el.classList.toggle("is-lit", on), { rootMargin: "-42% 0px -42% 0px" });
    watch("video[data-auto]", (el, on) => { const v = el as HTMLVideoElement; if (on && !reduce) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.05 });
    watch("iframe[data-src]", (el, on, io) => { if (on) { (el as HTMLIFrameElement).src = el.dataset.src!; io.unobserve(el); } }, { rootMargin: "600px" });
    if (!reduce) {
      // count up from 0 (the stats fade in before they count, so don't flash the final number first)
      d.querySelectorAll("[data-count]").forEach(el => { el.textContent = "0"; });
      watch("[data-count]", (el, on, io) => {
        if (!on) return;
        io.unobserve(el);
        const end = +el.dataset.count!;
        let t0 = 0;
        const step = (t: number) => {
          t0 ||= t; // rAF time, not performance.now(): that can be later than the first frame's time and go negative
          const k = Math.min(1, (t - t0) / 1600);
          el.textContent = String(Math.round(end * (1 - (1 - k) ** 4)));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: 0.6 });
    }

    /* The Room, "step inside": while the stage is pinned, each arch goes from the small frame between the words
       (.portal__gap) to its own place in .portal__arches. Transform and opacity only; sizes are measured on resize
       from layout (offsets ignore transforms), so scrolling never reads layout. */
    const portal = d.querySelector<HTMLElement>(".portal");
    const stage = portal?.querySelector<HTMLElement>(".portal__stage");
    const gap = portal?.querySelector<HTMLElement>(".portal__gap");
    const arches = [...(portal?.querySelectorAll<HTMLElement>(".portal__arch") ?? [])];
    const pimgs = arches.map(a => a.querySelector("img"));
    const halves = [...(portal?.querySelectorAll<HTMLElement>(".portal__l, .portal__r") ?? [])];
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
    /** place the arches for the current scroll, while the portal is on screen (or always, when `force`d) */
    const portalFrame = (force = false) => {
      const r = portal?.getBoundingClientRect();
      if (r && (force || (r.bottom > 0 && r.top < innerHeight))) place(clamp(-r.top / run));
    };
    if (portal) {
      measure();
      portalFrame(true);
      const remeasure = () => { measure(); portalFrame(); };
      addEventListener("resize", remeasure, { passive: true, signal: ac.signal });
      d.fonts?.ready.then(remeasure); // the headline's width moves the frame between the words
    }

    /* every scrolled frame: the story's words light up and its moon waxes, the arches move, the dock shows */
    const story = d.querySelector<HTMLElement>(".story");
    const words = [...(story?.querySelectorAll<HTMLElement>(".w") ?? [])];
    const moon = d.querySelector<HTMLElement>(".moon");
    const dock = d.querySelector<HTMLElement>(".dock");
    let ticking = false;
    const frame = () => {
      ticking = false;
      const r = story?.getBoundingClientRect();
      if (r && r.bottom > 0 && r.top < innerHeight) { // only while the story is on screen
        const p = clamp((innerHeight * 0.75 - r.top) / (r.height * 0.62));
        const n = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle("on", i < n));
        moon?.style.setProperty("--p", p.toFixed(3));
      }
      portalFrame();
      dock?.classList.toggle("is-on", scrollY > innerHeight * 0.6);
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    addEventListener("scroll", req, { passive: true, signal: ac.signal });
    addEventListener("resize", req, { passive: true, signal: ac.signal });
    frame();

    return () => { ac.abort(); observers.forEach(io => io.disconnect()); };
  }, []);

  return null;
}
