"use client";
import { scrollToId } from "@/lib/scroll";

/** A button that smooth-scrolls to a section on the page. Used instead of #hash links. */
export default function ScrollTo({ to, className, onClick, children }: { to: string; className?: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => { onClick?.(); scrollToId(to); }}>
      {children}
    </button>
  );
}
