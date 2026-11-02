import Link from "next/link";
import { Wordmark, Tagline } from "./Brand";
import { IPhone, IPin, IBook, IHome } from "./Icons";
import { SITE } from "@/lib/site";

export function Footer({ home = true }: { home?: boolean }) {
  return (
    <footer className="foot">
      <div className="wrap">
        <Wordmark className="foot__wm" />
        <div className="foot__row">
          <Tagline className="foot__tag" label="Beyond Fine Dining" />
          <nav>
            {home ? <Link href="/menu">Menu</Link> : <Link href="/">Home</Link>}
            <Link href="/#visit">Visit</Link>
            <a href={SITE.instagram} target="_blank" rel="noopener">Instagram</a>
            <a href={SITE.facebook} target="_blank" rel="noopener">Facebook</a>
          </nav>
          <span>© {new Date().getFullYear()} Luna Dine · Salkia, Howrah</span>
        </div>
      </div>
    </footer>
  );
}

export function Dock({ home = true }: { home?: boolean }) {
  return (
    <div className="dock">
      <a href={SITE.tel}><IPhone /> Call</a>
      {home ? <Link href="/menu"><IBook /> Menu</Link> : <Link href="/"><IHome /> Home</Link>}
      <a href={SITE.maps} target="_blank" rel="noopener"><IPin /> Directions</a>
    </div>
  );
}
