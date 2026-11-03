import Link from "next/link";
import { Wordmark, Tagline } from "./Brand";
import { IPhone, IPin, IBook, ISeal, ILeaf } from "./Icons";
import { SITE } from "@/lib/site";
import ScrollTo from "./ScrollTo";

/** The owner's kitchen promise, on /menu (`className="promise"`) and beside the home Signatures headline
 *  (`"sig__promise"`). Owner-supplied claims: don't extend or reword them without the owner. */
export function KitchenPromise({ className }: { className: string }) {
  return (
    <ul className={className} aria-label="Our kitchen promise">
      <li><ISeal />No Ajinomoto</li>
      <li><ISeal />No trans fat</li>
      <li><ISeal />No food colour</li>
      <li className="veg"><ILeaf />Separate chef &amp; utensils for our vegetarian menu</li>
    </ul>
  );
}

/** Home page footer. */
export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <Wordmark className="foot__wm" />
        <div className="foot__row">
          <Tagline className="foot__tag" label="Beyond Fine Dining" />
          <nav>
            <Link href="/menu">Menu</Link>
            <ScrollTo to="visit">Visit</ScrollTo>
            <a href={SITE.instagram} target="_blank" rel="noopener">Instagram</a>
            <a href={SITE.facebook} target="_blank" rel="noopener">Facebook</a>
          </nav>
          <span>© {new Date().getFullYear()} Luna Dine · Salkia, Howrah</span>
        </div>
      </div>
    </footer>
  );
}

/** Home page call / menu / directions bar for phones (≤860px); PageFX shows it once you scroll. */
export function Dock() {
  return (
    <div className="dock">
      <a href={SITE.tel}><IPhone /> Call</a>
      <Link href="/menu"><IBook /> Menu</Link>
      <a href={SITE.maps} target="_blank" rel="noopener"><IPin /> Directions</a>
    </div>
  );
}
