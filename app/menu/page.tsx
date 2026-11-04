import type { Metadata } from "next";
import Link from "next/link";
import MenuBrowser from "@/components/MenuBrowser";
import { Emblem, Wordmark } from "@/components/Brand";
import { KitchenPromise } from "@/components/Chrome";
import { SITE } from "@/lib/site";
import ogMenu from "@/assets/img/og-menu.jpg";

export const metadata: Metadata = {
  title: "Menu — Chinese, Tandoor, Bengali, Thai & Korean in Salkia, Howrah",
  description:
    "The full Luna Dine menu — soups, Chinese starters, noodles, fried rice, momos, tandoor, biryani & pulao, Indian & Bengali curries, breads, mocktails, shakes and desserts, with prices. No Ajinomoto, no trans fat, no food colour, and a separate chef and utensils for vegetarian dishes.",
  alternates: { canonical: "/menu" },
  // A page's openGraph replaces the layout's whole object, so repeat the shared fields.
  openGraph: {
    type: "website",
    siteName: "Luna Dine",
    locale: "en_IN",
    url: "/menu",
    title: "Luna Dine — The Menu",
    description: "Every dish and price at Luna Dine, Salkia. No Ajinomoto, no trans fat, no food colour; separate chef and utensils for veg.",
    images: [{ url: ogMenu.src, width: ogMenu.width, height: ogMenu.height, alt: "The Luna Dine menu, with the kitchen promise: no Ajinomoto, no trans fat, no food colour." }],
  },
  twitter: { card: "summary_large_image", images: [ogMenu.src] },
};

/** The menu and nothing else: this page is what the table QR codes open. */
export default function MenuPage() {
  return (
    <>
      <header className="qhead">
        <div className="wrap">
          <div className="qhead__arch">
            <Link className="qhead__brand" href="/" aria-label="Luna Dine home">
              <Emblem className="emb" />
              <Wordmark className="wm" label="Luna Dine" />
            </Link>
            <h1>Menu</h1>
          </div>
          <KitchenPromise className="promise" />
        </div>
      </header>
      <main>
        <MenuBrowser prodHost={new URL(SITE.url).hostname} />
      </main>
    </>
  );
}
