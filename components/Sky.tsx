"use client";
import { useEffect, useRef } from "react";

type Star = { x: number; y: number; r: number; z: number; p: number; s: number; g: boolean };

/** Twinkling starfield with gentle pointer parallax and the occasional shooting star. Pauses off-screen. */
export default function Sky({ className, density = 1 }: { className?: string; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(pointer: fine)").matches;
    let w = 0, h = 0, stars: Star[] = [], visible = true, alive = true;
    let mx = 0, my = 0, tx = 0, ty = 0, last = 0, nextShoot = 2500;
    let shoot: { x: number; y: number; l: number } | null = null;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(420, Math.round((w * h) / 4200 * density));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() ** 3 * 1.6 + 0.25,
        z: Math.random() * 0.9 + 0.1, p: Math.random() * Math.PI * 2, s: 0.6 + Math.random() * 1.8, g: Math.random() < 0.12,
      }));
    };
    const onMove = (e: PointerEvent) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; };

    const loop = (t: number) => {
      if (!alive || !visible || document.hidden) return;
      const dt = Math.min(50, t - last || 16); last = t;
      mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.s + s.p);
        const x = (s.x - mx * 30 * s.z + w) % w, y = (s.y - my * 20 * s.z + h) % h;
        ctx.globalAlpha = tw * (0.35 + s.z * 0.65);
        ctx.fillStyle = s.g ? "#f6d39a" : "#f4ecda";
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.283); ctx.fill();
        if (s.r > 1.25) { ctx.globalAlpha *= 0.18; ctx.beginPath(); ctx.arc(x, y, s.r * 4, 0, 6.283); ctx.fill(); }
      }
      if (!reduce) {
        nextShoot -= dt;
        if (!shoot && nextShoot < 0) { shoot = { x: Math.random() * w * 0.7 + w * 0.2, y: Math.random() * h * 0.35, l: 0 }; nextShoot = 4000 + Math.random() * 6000; }
        if (shoot) {
          shoot.l += dt * 0.9;
          const L = Math.min(shoot.l, 160), hx = shoot.x - shoot.l * 0.9, hy = shoot.y + shoot.l * 0.45;
          const g = ctx.createLinearGradient(hx, hy, hx + L * 0.9, hy - L * 0.45);
          g.addColorStop(0, "rgba(255,240,210,.95)"); g.addColorStop(1, "rgba(255,240,210,0)");
          ctx.globalAlpha = Math.max(0, 1 - shoot.l / 700);
          ctx.strokeStyle = g; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + L * 0.9, hy - L * 0.45); ctx.stroke();
          if (shoot.l > 700) shoot = null;
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(loop);
    };

    resize();
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) requestAnimationFrame(loop); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden && visible) requestAnimationFrame(loop); };
    addEventListener("resize", resize, { passive: true });
    if (fine) addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false; io.disconnect();
      removeEventListener("resize", resize); removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [density]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
