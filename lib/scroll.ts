/** Smooth-scroll to a section by id, without touching the URL (the site uses no #hash links). */
export function scrollToId(id: string | null) {
  const el = id ? document.getElementById(id) : null;
  if (id && !el) return;
  document.documentElement.classList.remove("menu-open");
  const lenis = window.LD?.lenis;
  lenis?.start();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (lenis) lenis.scrollTo(el ?? 0, { duration: 1.4 });
  else if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  else window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}
