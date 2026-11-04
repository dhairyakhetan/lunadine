"use client";
import { scrollToId } from "@/lib/scroll";

/** A button that smooth-scrolls to a section on the page, leaving the URL alone. Used instead of #hash links. */
export default function ScrollTo({ to, onClick, children }: { to: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => { onClick?.(); scrollToId(to); }}>
      {children}
    </button>
  );
}
