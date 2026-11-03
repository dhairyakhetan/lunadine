/* Scrolling and motion helpers for both pages. Lenis (components/SmoothScroll.tsx) drives the window's native scroll,
   so scrollY and scroll events stay accurate; it's null under reduced motion, so each helper falls back to
   window.scrollTo. In-page navigation never changes the URL (the site has no #hash links). */

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Page Y of an element's top edge (as drawn: an element mid-transform reads where it is on screen). */
export const pageTop = (el: Element) => el.getBoundingClientRect().top + scrollY;

/** Smooth-scroll the page to `y` (instant under reduced motion). */
export function scrollToY(y: number, duration = 1.1) {
  const lenis = window.LD?.lenis;
  lenis?.start(); // a stopped Lenis ignores scrollTo, e.g. while the phone nav sheet is still closing
  if (lenis) lenis.scrollTo(y, { duration });
  else window.scrollTo({ top: y, behavior: reducedMotion() ? "auto" : "smooth" });
}

/** Jump to `y` at once (keeping the reader's place, restoring a position). */
export function jumpToY(y: number) {
  const lenis = window.LD?.lenis;
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
}

/** Smooth-scroll to a section by id (null: the top of the page). */
export function scrollToId(id: string | null) {
  const el = id ? document.getElementById(id) : null;
  if (!id || el) scrollToY(el ? pageTop(el) : 0, 1.4);
}
