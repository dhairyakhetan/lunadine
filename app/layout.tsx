import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import SmoothScroll from "@/components/SmoothScroll";
import { SITE } from "@/lib/site";
import "./globals.css";

const serif = localFont({
  src: [
    { path: "./instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});
const sans = localFont({
  src: "./outfit-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Luna Dine — Beyond Fine Dining · Exotic Multicuisine, Salkia, Howrah",
    template: "%s · Luna Dine",
  },
  description:
    "Luna Dine is an exotic multicuisine restaurant on Salkia School Road, Howrah — Chinese, tandoor, Bengali, Thai and Korean under one moonlit roof. Call 074397 24362 to reserve.",
  icons: { icon: "/img/favicon.svg", apple: "/img/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "Luna Dine — Beyond Fine Dining",
    description: "Exotic multicuisine on Salkia School Road, Howrah. Chinese, tandoor, Bengali, Thai & Korean.",
    url: "/",
    images: [{ url: "/img/og-home.jpg", width: 1200, height: 630, alt: "Luna Dine — Beyond Fine Dining. Chinese, tandoor, Bengali, Thai and Korean in Salkia, Howrah." }],
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", images: ["/img/og-home.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#080d1b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Skip the intro animation for returning visitors, reduced-motion users, and any page other than home.
const introScript = `try{if(location.pathname!=='/'||sessionStorage.getItem('ld-intro')||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('no-intro')}catch(e){}`;

const noScriptCss = "[data-reveal],.split .line>span{opacity:1!important;transform:none!important}.story__text .w{opacity:1}";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        {/* Without JS the scroll reveals never run, so show that content instead of leaving it invisible. */}
        <noscript dangerouslySetInnerHTML={{ __html: `<style>${noScriptCss}</style>` }} />
      </head>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
