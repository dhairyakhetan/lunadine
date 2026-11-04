import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import SmoothScroll from "@/components/SmoothScroll";
import favicon from "@/assets/img/favicon.svg";
import appleIcon from "@/assets/img/apple-touch-icon.png";
import ogHome from "@/assets/img/og-home.jpg";
import { SITE } from "@/lib/site";
import "./globals.css";

const serif = localFont({
  src: [
    { path: "../assets/fonts/instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});
const sans = localFont({
  src: "../assets/fonts/outfit-latin-wght-normal.woff2",
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
  icons: { icon: favicon.src, apple: appleIcon.src },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "Luna Dine — Beyond Fine Dining",
    description: "Exotic multicuisine on Salkia School Road, Howrah. Chinese, tandoor, Bengali, Thai & Korean.",
    url: "/",
    images: [{ url: ogHome.src, width: ogHome.width, height: ogHome.height, alt: "Luna Dine — Beyond Fine Dining. Chinese, tandoor, Bengali, Thai and Korean in Salkia, Howrah." }],
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", images: [ogHome.src] },
};

export const viewport: Viewport = {
  themeColor: "#080d1b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Skip the intro animation for returning visitors, reduced-motion users, and any page other than home.
// On /menu, also apply the saved Veg / Non-veg filter before paint (see MenuBrowser), so a refresh doesn't flash the full menu.
const introScript = `try{var h=document.documentElement,d=sessionStorage.getItem('ld-diet');if(location.pathname!=='/'||sessionStorage.getItem('ld-intro')||matchMedia('(prefers-reduced-motion: reduce)').matches)h.classList.add('no-intro');if(location.pathname==='/menu'&&(d==='v'||d==='n'))h.classList.add('diet-'+d)}catch(e){}`;

const noScriptCss = "[data-reveal],.split .line>span{opacity:1!important;transform:none!important}.story__text .w{opacity:1}.portal{height:auto}.portal__stage{position:relative}.portal__arch{visibility:visible!important}.portal__cap{opacity:1}.detour__road{clip-path:none}.detour__road circle{transform:none}";

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
