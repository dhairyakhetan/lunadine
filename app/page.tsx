import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { preload } from "react-dom";
import Nav from "@/components/Nav";
import Sky from "@/components/Sky";
import PageFX from "@/components/PageFX";
import { Footer, Dock, KitchenPromise } from "@/components/Chrome";
import { Emblem, Ornament, Wordmark } from "@/components/Brand";
import { IArrow, IPhone, IMail, IClock, IInstagram, IFacebook, IWhatsApp, Veg } from "@/components/Icons";
import { MENU, TOTAL_DISHES, TOTAL_SECTIONS } from "@/lib/menu";
import { SITE } from "@/lib/site";

const MARQUEE = ["Chinese", "Tandoor", "Bengali", "Thai", "Korean", "Biryani", "Momos", "Mocktails"];

const ROOM = [
  { f: "sign-deer", t: "The sign", s: "Salkia School Rd" },
  { f: "arches", t: "Pichwai arches", s: "Hand-painted" },
  { f: "moon-wall", t: "The moon wall", s: "Coral & green" },
  { f: "table-setting", t: "Set & waiting", s: "Plates down, glasses out" },
  { f: "pendant", t: "Lantern light", s: "Warm, low, golden" },
  { f: "moon-garden", t: "Garden booth", s: "Moss & moon" },
  { f: "pichwai-table", t: "Table for four", s: "Under the art" },
  { f: "arches-wide", t: "The long room", s: "Mustard & marble" },
  { f: "facade-dusk", t: "Beyond fine dining", s: "Opp. Ghasbagan Maidan" },
];

// "Step inside": the arches that open up as you scroll into The Room (phones show only the middle one)
const PORTAL = [
  { f: "moon-wall", a: "The moon wall and coral booths at Luna Dine" },
  { f: "arches", a: "Hand-painted Pichwai arches, lit from within, at Luna Dine" },
  { f: "moon-garden", a: "A garden booth under the moon at Luna Dine" },
];

const MENU_ITEMS = MENU.flatMap(s => s.groups.flatMap(g => g.items.map(([name, pr]) => ({ name, pr, t: g.t }))));
// Signature dishes: n is the name shown, m the dish's name in lib/menu.ts when it differs. The price and the
// veg / non-veg mark come from the menu, so they can't drift from it (the build fails if a name isn't found).
const DISHES = [
  { c: "Chinese", n: "Drums of Heaven", p: "Chicken winglets frenched into lollipops, tossed hot in a glossy chilli-garlic glaze." },
  { c: "Thai", n: "Pad Thai Noodles", m: "Pad Thai Chicken Noodles", p: "Flat rice noodles wok-tossed the Bangkok way — sweet, sour, a little nutty." },
  { c: "Korean", n: "Kimchi Fried Rice", m: "Korean Kimchi Fried Rice", p: "Tangy, fermented kimchi and smoky wok heat folded through every grain." },
  { c: "Tandoor", n: "Chicken Afghani", m: "Chicken Afghani — Full", p: "A creamy, gently spiced marinade, charred slow in the clay oven. Full bird." },
  { c: "Tandoor", n: "Malai Cheese Tikka", m: "Paneer Malai Cheese Tikka", p: "Paneer in a rich cream-and-cheese marinade, kissed by the tandoor." },
  { c: "Bengali", n: "Sorshe Pomfret", p: "Pomfret in a sharp, golden mustard gravy — a Bengali Sunday on a plate." },
  { c: "Biryani", n: "Mutton Biryani Special", p: "Fragrant long-grain rice and tender mutton, sealed and slow-cooked." },
  { c: "Indian", n: "Dal Makhani", p: "Black lentils simmered low and long, finished with butter and cream." },
  { c: "Mocktail", n: "Kiwi Mojito", p: "Fresh kiwi, mint and lime over crushed ice, topped with fizz." },
].map(d => {
  const item = MENU_ITEMS.find(i => i.name === (d.m ?? d.n));
  if (!item) throw new Error(`Signature dish "${d.m ?? d.n}" isn't in lib/menu.ts`);
  return { ...d, t: item.t, pr: item.pr };
});

// Story copy: *word* = gold italic. Pre-split into spans so the scroll effect can light them one by one.
const STORY = "From a dream taking shape to a room filled with *warm* *light.* Hand-painted Pichwai arches, a glowing *moon* on the wall, a garden of green — and a kitchen that cooks across *five* *cuisines.* Pull up a chair in Salkia. Stay a while.";

const jsonLd = {
  "@context": "https://schema.org", "@type": "Restaurant", name: SITE.name, slogan: SITE.tagline,
  servesCuisine: ["Chinese", "Indian", "Bengali", "Thai", "Korean", "Mughlai"],
  telephone: SITE.phone, email: SITE.email, priceRange: "₹₹", url: SITE.url, image: `${SITE.url}/img/og-home.jpg`,
  address: { "@type": "PostalAddress", streetAddress: "140/2 Salkia School Road, Opposite Ghasbagan Maidan, near Sansaraa", addressLocality: "Howrah", addressRegion: "West Bengal", postalCode: "711101", addressCountry: "IN" },
  geo: { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng },
  // open every day, 11 am to midnight (owner, Nov 2026); 23:59 is the unambiguous way to write midnight here
  openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "11:00", closes: "23:59" }],
  hasMenu: `${SITE.url}/menu`, acceptsReservations: true, sameAs: [SITE.instagram, SITE.facebook],
};

/** A dish name split into letters (each with its index as --i), so they can light up and lift one after another.
 *  Words stay unbreakable; screen readers get the plain name from an sr-only copy. */
const Letters = ({ text }: { text: string }) => {
  let i = 0;
  return (
    <span className="dl-name" aria-hidden="true">
      {text.split(" ").map((w, wi) => (
        <Fragment key={wi}>
          {wi > 0 && " "}
          <span className="dl-w">{[...w].map(ch => <span className="dl" key={i} style={{ "--i": i++ } as React.CSSProperties}>{ch}</span>)}</span>
        </Fragment>
      ))}
    </span>
  );
};

/** a reveal / entrance delay (the CSS reads --d) */
const delay = (s: number) => ({ "--d": `${s}s` }) as React.CSSProperties;

export default function Home() {
  // The hero video's poster is the first big thing you see (full-screen on phones); start fetching it early.
  preload("/video/hero-poster.webp", { as: "image", fetchPriority: "high" });
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageFX />

      <div className="intro" aria-hidden="true">
        <div className="intro__mark">
          <svg className="intro__ring" viewBox="0 0 240 240"><circle cx="120" cy="120" r="100" transform="rotate(-90 120 120)" /></svg>
          <Emblem className="emb" />
        </div>
      </div>

      {/* section ids match the <section id>s below; the phone sheet lists all five, the bar all but Menu */}
      <Nav
        brand={<Link className="brand" href="/" aria-label="Luna Dine home"><Emblem className="emb" /><Wordmark className="wm" label="Luna Dine" /></Link>}
        links={[["story", "Story"], ["room", "The Room"], ["signatures", "Signatures"], ["/menu", "Menu"], ["visit", "Visit"]]}
      />

      <main>
        {/* HERO */}
        <section className="hero" id="top">
          <Sky className="hero__sky" />
          <div className="wrap hero__grid">
            <div className="hero__copy">
              <span className="kicker reveal-in" style={delay(.1)}>Exotic multicuisine · Salkia, Howrah</span>
              <h1 className="h-xl">
                <span className="line"><span style={delay(.15)}>Beyond</span></span>
                <span className="line"><span style={delay(.27)}><em>fine</em> dining</span></span>
              </h1>
              <p className="lead reveal-in" style={delay(.5)}>
                Wok-fired Chinese, smoky tandoor, Bengali home classics and Thai–Korean twists — served under one moonlit roof, opposite Ghasbagan Maidan.
              </p>
              <div className="hero__cta reveal-in" style={delay(.62)}>
                <Link className="btn" href="/menu">Explore the menu <IArrow /></Link>
                <a className="btn btn--ghost" href={SITE.tel}><IPhone /> Call to reserve</a>
              </div>
            </div>
            <div className="hero__arch">
              <div className="arch">
                <div className="arch__in">
                  <video data-auto muted playsInline loop autoPlay preload="metadata" poster="/video/hero-poster.webp" aria-label="Inside Luna Dine">
                    <source src="/video/hero.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
              <span className="hero__moon" aria-hidden="true" />
            </div>
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee__track">
            {[...MARQUEE, ...MARQUEE].map((w, i) => <span key={i}>{w}</span>)}
          </div>
        </div>

        {/* STORY */}
        <section className="story" id="story">
          <div className="wrap story__grid">
            <div>
              <div className="moon" aria-hidden="true" />
              <div className="moon-cap" aria-hidden="true">Waxing · Est. 2026</div>
            </div>
            <div>
              <span className="kicker" data-reveal>A new chapter begins</span>
              <p className="story__text">
                {STORY.split(" ").map((w, i) => {
                  const g = w.startsWith("*");
                  return <span key={i}><span className={g ? "w g" : "w"}>{g ? w.replace(/\*/g, "") : w}</span>{" "}</span>;
                })}
              </p>
            </div>
          </div>
          <div className="wrap">
            <div className="stats" data-reveal>
              <div className="stat"><b data-count={TOTAL_DISHES}>{TOTAL_DISHES}</b><span>Dishes on the menu</span></div>
              <div className="stat"><b data-count={5}>5</b><span>Cuisines, one kitchen</span></div>
              <div className="stat"><b data-count={TOTAL_SECTIONS}>{TOTAL_SECTIONS}</b><span>Menu chapters</span></div>
              <div className="stat"><b>1</b><span>Moon on the wall</span></div>
            </div>
          </div>
        </section>

        {/* ROOM */}
        <section className="room" id="room">
          {/* pinned while you scroll: the small arch between the words opens into the room (PageFX drives it) */}
          <div className="portal">
            <div className="portal__stage">
              <div className="portal__arches">
                {PORTAL.map((a, i) => (
                  <div className={i === 1 ? "portal__arch portal__arch--c" : "portal__arch"} key={a.f}>
                    <Image src={`/img/${a.f}.webp`} alt={a.a} width={720} height={1280} sizes="(orientation: portrait) 100vw, 30vw" />
                  </div>
                ))}
              </div>
              <div className="portal__head">
                <span className="kicker">The Room</span>
                <h2 className="portal__h">
                  <span className="portal__l">Step inside</span>
                  <span className="portal__gap" aria-hidden="true" />
                  <span className="portal__r">the <em>glow</em></span>
                </h2>
              </div>
              <p className="portal__cap">Arches lit from within, booths in coral and forest green, a lantern over every corner.</p>
            </div>
          </div>
          {/* auto-scrolling gallery: the cards are rendered twice and the track slides by half its width, looping seamlessly */}
          <div className="room__reel">
            <div className="room__track">
              {[...ROOM, ...ROOM].map((c, i) => {
                const copy = i >= ROOM.length;
                return (
                  <figure className={i % ROOM.length % 2 ? "card card--low" : "card"} key={i} aria-hidden={copy || undefined}>
                    <div className="card__img">
                      <Image src={`/img/${c.f}.webp`} alt={copy ? "" : `${c.t.replace("&", "and")} at Luna Dine`} width={720} height={1280} sizes="(max-width:860px) 62vw, 22vw" />
                    </div>
                    <figcaption><b>{c.t}</b><span>{c.s}</span></figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </section>

        {/* SIGNATURES */}
        <section className="sig paper" id="signatures">
          <div className="wrap">
            <div className="sig__head">
              <div>
                <span className="kicker" data-reveal>From the kitchen</span>
                <h2 className="h-l split">
                  <span className="line"><span>Plates worth</span></span>
                  <span className="line line--road"><span style={delay(.1)}>the <em className="detour">detour<svg className="detour__road" viewBox="0 0 220 30" preserveAspectRatio="none" aria-hidden="true"><path d="M4 20 C 28 6, 50 28, 78 16 S 126 2, 152 15 S 192 28, 210 12" /><circle cx="210" cy="12" r="5" /></svg></em></span></span>
                </h2>
              </div>
              <div className="sig__aside" data-reveal style={delay(.1)}>
                <div className="ornament"><Ornament /></div>
                <p>A short list from a menu of {TOTAL_DISHES}, and every plate comes with the kitchen&rsquo;s promise</p>
                <KitchenPromise className="sig__promise" />
              </div>
            </div>
            <div className="dishes">
              {DISHES.map((x, i) => (
                <article className="dish" data-reveal style={delay((i % 3) * 0.09)} key={x.n}>
                  <span className="dish__sky" aria-hidden="true"><i className="dish__moon" /></span>
                  <div className="dish__top"><span>{x.c}</span><Veg t={x.t} /></div>
                  <h3><span className="sr-only">{x.n}</span><Letters text={x.n} /></h3>
                  <p>{x.p}</p>
                  <span className="dish__price">₹{x.pr}</span>
                </article>
              ))}
            </div>
            <div className="sig__cta" data-reveal><Link className="btn btn--ink" href="/menu">See all {TOTAL_DISHES} dishes <IArrow /></Link></div>
          </div>
        </section>

        {/* VISIT */}
        <section className="visit" id="visit">
          <div className="visit__bg" aria-hidden="true">
            <Image src="/img/sign-luna.webp" alt="" fill sizes="100vw" />
          </div>
          <div className="wrap visit__grid">
            <div>
              <span className="kicker" data-reveal>Visit us</span>
              <h2 className="h-l split">
                <span className="line"><span>Follow the</span></span>
                <span className="line"><span style={delay(.1)}><em>moonlight</em></span></span>
              </h2>
              <div className="info" data-reveal>
                <a href={SITE.maps} target="_blank" rel="noopener"><small>Find us</small><b>{SITE.address}</b><IArrow /></a>
                <a href={SITE.tel}><small>Reserve</small><b>{SITE.phone}</b><IPhone /></a>
                <a href={`mailto:${SITE.email}`}><small>Write</small><b>{SITE.email}</b><IMail /></a>
                <div><small>Hours</small><b>Daily, 11 am – midnight</b><IClock /></div>
              </div>
              <div className="socials" data-reveal>
                <a href={SITE.instagram} target="_blank" rel="noopener" aria-label="Instagram"><IInstagram /></a>
                <a href={SITE.facebook} target="_blank" rel="noopener" aria-label="Facebook"><IFacebook /></a>
                <a href={SITE.whatsapp} target="_blank" rel="noopener" aria-label="WhatsApp"><IWhatsApp /></a>
              </div>
            </div>
            <div className="map" data-reveal style={delay(.1)}>
              <iframe title="Map to Luna Dine" data-src={SITE.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <span className="map__pin" aria-hidden="true" />
              <a className="btn map__cta" href={SITE.maps} target="_blank" rel="noopener">Get directions <IArrow /></a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <Dock />
    </>
  );
}
