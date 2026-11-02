import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Sky from "@/components/Sky";
import PageFX from "@/components/PageFX";
import MenuBrowser from "@/components/MenuBrowser";
import { Footer, Dock } from "@/components/Chrome";
import { Ornament } from "@/components/Brand";
import { IUp, ISeal, ILeaf } from "@/components/Icons";
import { TOTAL_DISHES } from "@/lib/menu";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Menu — Chinese, Tandoor, Bengali, Thai & Korean in Salkia, Howrah",
  description:
    "The full Luna Dine menu — soups, Chinese starters, noodles, fried rice, momos, tandoor, biryani, Indian & Bengali curries, breads, mocktails, shakes and desserts, with prices. No Ajinomoto, no trans fat, no food colour, and a separate chef and utensils for vegetarian dishes.",
  alternates: { canonical: "/menu" },
  openGraph: { title: "Luna Dine — The Menu", images: ["/img/og.jpg"] },
};

const d = (v: string) => ({ "--d": v }) as React.CSSProperties;

export default function MenuPage() {
  return (
    <>
      <PageFX noIntro />
      <Nav
        links={[{ href: "/#story", label: "Story" }, { href: "/#room", label: "The Room" }, { href: "/menu", label: "Menu", current: true }, { href: "/#visit", label: "Visit" }]}
        cta={{ href: SITE.tel, label: "Reserve" }}
        sheet={[{ href: "/", label: "Home" }, { href: "/#room", label: "The Room" }, { href: "/menu", label: "Menu" }, { href: "/#visit", label: "Visit" }, { href: SITE.tel, label: "Reserve" }]}
      />
      <main>
        <section className="mhead">
          <Sky density={0.7} />
          <div className="wrap">
            <div className="ornament reveal-in" style={d(".05s")}><Ornament /></div>
            <span className="kicker reveal-in" style={d(".1s")}>Menu Card</span>
            <h1 className="h-xl" style={{ marginTop: 18 }}>
              <span style={{ display: "block", overflow: "hidden" }}>
                <span className="reveal-in" style={{ display: "inline-block", ...d(".15s") }}>The <em>menu.</em></span>
              </span>
            </h1>
            <p className="lead reveal-in" style={d(".3s")}>
              {TOTAL_DISHES} dishes across Chinese, Thai, Korean, tandoor, Indian and Bengali kitchens. Search anything, or filter by veg&nbsp;/&nbsp;non&#8209;veg.
            </p>
            <div className="promise reveal-in" style={d(".35s")}>
              <span className="promise__title">Our kitchen promise</span>
              <ul>
                <li><ISeal />No Ajinomoto</li>
                <li><ISeal />No trans fat</li>
                <li><ISeal />No food colour</li>
                <li className="promise__veg"><ILeaf />Separate chef &amp; utensils for our vegetarian menu</li>
              </ul>
            </div>
            <div className="ornament flip reveal-in" style={d(".4s")}><Ornament /></div>
          </div>
        </section>
        <MenuBrowser />
      </main>
      <Footer home={false} />
      <button className="to-top" aria-label="Back to top"><IUp /></button>
      <Dock home={false} />
    </>
  );
}
