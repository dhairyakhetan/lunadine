import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { preload } from "react-dom";
import Nav from "@/components/Nav";
import Sky from "@/components/Sky";
import PageFX from "@/components/PageFX";
import { Footer, Dock } from "@/components/Chrome";
import { Emblem, Ornament, EMBLEM_D, EMBLEM_VB } from "@/components/Brand";
import { IArrow, IPhone, IMail, IClock, ISeal, ILeaf, IInstagram, IFacebook, IWhatsApp } from "@/components/Icons";
import { TOTAL_DISHES, TOTAL_SECTIONS } from "@/lib/menu";
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

const DISHES: { c: string; t: "v" | "n" | "x"; n: string; p: string; pr: number }[] = [
  { c: "Chinese", t: "n", n: "Drums of Heaven", p: "Chicken winglets frenched into lollipops, tossed hot in a glossy chilli-garlic glaze.", pr: 280 },
  { c: "Thai", t: "n", n: "Pad Thai Noodles", p: "Flat rice noodles wok-tossed the Bangkok way — sweet, sour, a little nutty.", pr: 300 },
  { c: "Korean", t: "v", n: "Kimchi Fried Rice", p: "Tangy, fermented kimchi and smoky wok heat folded through every grain.", pr: 250 },
  { c: "Tandoor", t: "n", n: "Chicken Afghani", p: "A creamy, gently spiced marinade, charred slow in the clay oven. Full bird.", pr: 540 },
  { c: "Tandoor", t: "v", n: "Malai Cheese Tikka", p: "Paneer in a rich cream-and-cheese marinade, kissed by the tandoor.", pr: 350 },
  { c: "Bengali", t: "n", n: "Sorshe Pomfret", p: "Pomfret in a sharp, golden mustard gravy — a Bengali Sunday on a plate.", pr: 440 },
  { c: "Biryani", t: "n", n: "Mutton Biryani Special", p: "Fragrant long-grain rice and tender mutton, sealed and slow-cooked.", pr: 400 },
  { c: "Indian", t: "v", n: "Dal Makhani", p: "Black lentils simmered low and long, finished with butter and cream.", pr: 350 },
  { c: "Mocktail", t: "x", n: "Kiwi Mojito", p: "Fresh kiwi, mint and lime over crushed ice, topped with fizz.", pr: 185 },
];

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

const Veg = ({ t }: { t: "v" | "n" | "x" }) =>
  t === "x" ? null : <i className={t === "v" ? "vg" : "vg n"} role="img" aria-label={t === "v" ? "Veg" : "Non-veg"} />;

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

      <Nav
        links={[{ href: "#story", label: "Story" }, { href: "#room", label: "The Room" }, { href: "#signatures", label: "Signatures" }, { href: "#visit", label: "Visit" }]}
        cta={{ href: "/menu", label: "View menu" }}
        sheet={[{ href: "#story", label: "Story" }, { href: "#room", label: "The Room" }, { href: "#signatures", label: "Signatures" }, { href: "/menu", label: "Menu" }, { href: "#visit", label: "Visit" }]}
      />

      <main>
        {/* HERO */}
        <section className="hero" id="top">
          <Sky className="hero__sky" />
          <div className="wrap hero__grid">
            <div className="hero__copy">
              <span className="kicker reveal-in" style={{ "--d": ".1s" } as React.CSSProperties}>Exotic multicuisine · Salkia, Howrah</span>
              <h1 className="h-xl">
                <span className="line"><span style={{ "--d": ".15s" } as React.CSSProperties}>Beyond</span></span>
                <span className="line"><span style={{ "--d": ".27s" } as React.CSSProperties}><em>fine</em> dining</span></span>
              </h1>
              <p className="lead reveal-in" style={{ "--d": ".5s" } as React.CSSProperties}>
                Wok-fired Chinese, smoky tandoor, Bengali home classics and Thai–Korean twists — served under one moonlit roof, opposite Ghasbagan Maidan.
              </p>
              <div className="hero__cta reveal-in" style={{ "--d": ".62s" } as React.CSSProperties}>
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
              <div className="hero__badge" aria-hidden="true">
                <svg viewBox="0 0 120 120">
                  <defs><path id="circ" d="M60,60 m-48,0 a48,48 0 1,1 96,0 a48,48 0 1,1 -96,0" /></defs>
                  <text><textPath href="#circ" textLength="298" lengthAdjust="spacing">Luna Dine ✦ Beyond Fine Dining ✦ Salkia ✦ </textPath></text>
                </svg>
                <svg className="c" viewBox={EMBLEM_VB}><path fill="currentColor" fillRule="evenodd" d={EMBLEM_D} /></svg>
              </div>
            </div>
          </div>
          <div className="scroll-cue" aria-hidden="true"><i />Scroll</div>
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
                  <span className="line line--road"><span style={{ "--d": ".1s" } as React.CSSProperties}>the <em className="detour">detour<svg className="detour__road" viewBox="0 0 220 30" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M4 20 C 28 6, 50 28, 78 16 S 126 2, 152 15 S 192 28, 210 12" /><circle cx="210" cy="12" r="5" /></svg></em></span></span>
                </h2>
              </div>
              <div className="sig__aside" data-reveal style={{ "--d": ".1s" } as React.CSSProperties}>
                <div className="ornament"><Ornament /></div>
                <p>A short list from a menu of {TOTAL_DISHES}, and every plate comes with the kitchen&rsquo;s promise</p>
                <ul className="sig__promise" aria-label="Our kitchen promise">
                  <li><ISeal />No Ajinomoto</li>
                  <li><ISeal />No trans fat</li>
                  <li><ISeal />No food colour</li>
                  <li className="sig__veg"><ILeaf />Separate chef &amp; utensils for our vegetarian menu</li>
                </ul>
              </div>
            </div>
            <div className="dishes">
              {DISHES.map((x, i) => (
                <article className="dish" data-reveal style={{ "--d": `${(i % 3) * 0.09}s` } as React.CSSProperties} key={x.n}>
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
                <span className="line"><span style={{ "--d": ".1s" } as React.CSSProperties}><em>moonlight</em></span></span>
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
            <div className="map" data-reveal style={{ "--d": ".1s" } as React.CSSProperties}>
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
