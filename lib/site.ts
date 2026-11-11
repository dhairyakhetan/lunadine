/* The live site address. Used for Open Graph images, og:url, the sitemap, robots.txt and structured data,
   and as the host where review mode stays hidden (see MenuBrowser). Set explicitly rather than read from
   Vercel's env, because with several domains attached Vercel can report an old one.
   Change it here if the domain changes (e.g. a custom domain), then redeploy. */
const PROD_URL = "https://luna-dine.vercel.app";

/* Luna Dine on Google Maps. PLACE_ID opens the listing itself (directions, photos) and Google's "write a review"
   box (/review), with no Business Profile access needed. It was worked out from the listing's own link, whose
   "1s0x3a027738557f3b17:0x484ce6ec9013b9dd" is the same ID in another encoding (ChIJ… is base64 of those two
   numbers). The position is the listing's pin, which is also its Plus Code H8RV+R7 Howrah (7MJCH8RV+R7). */
const PLACE_ID = "ChIJFzt_VTh3AjoR3bkTkOzmTEg";
const LAT = 22.5921127, LNG = 88.3431916;

export const SITE = {
  name: "Luna Dine",
  /** other names people search for (WebSite and Restaurant structured data on the home page) */
  alternateNames: ["LunaDine"],
  tagline: "Beyond Fine Dining",
  /** one-line description for search engines (meta description, structured data) */
  description: "Luna Dine is an exotic multicuisine restaurant on Salkia School Road, Howrah: Chinese, tandoor, Bengali, Thai and Korean under one moonlit roof.",
  url: PROD_URL,
  phone: "+91 74397 24362",
  tel: "tel:+917439724362",
  whatsapp: "https://wa.me/917439724362",
  email: "admin.lunadine@gmail.com",
  address: "140/2 Salkia School Road, opp. Ghasbagan Maidan, near Sansaraa, Howrah 711101",
  maps: `https://www.google.com/maps/search/?api=1&query=Luna%20Dine&query_place_id=${PLACE_ID}`, // opens the listing
  mapEmbed: `https://maps.google.com/maps?q=${LAT},${LNG}&z=17&output=embed`,
  instagram: "https://www.instagram.com/lunadine_exoticmulticuisine/",
  facebook: "https://www.facebook.com/profile.php?id=61595533162677",
  geo: { lat: LAT, lng: LNG },
  /* Where luna-dine.vercel.app/review sends people (the review QR codes point there, so this can change without
     reprinting; app/review/route.ts, redeploy to apply).
     review: the Business-Profile-style short review link, which on Android opens the Google Maps app straight to
       the review box (in a browser it shows Google's review box). Its code is the listing's CID
       (0x484ce6ec9013b9dd) as Google encodes it, base64 of [0x09, CID little-endian, 0x10, 0x01]; built from the
       listing, not issued by the Business Profile, and not yet tested on a phone. If it ever fails, set review to
       reviewWeb.
     reviewWeb: Google's "write a review" box in the browser, from PLACE_ID. The fallback button on /review. */
  review: "https://g.page/r/Cd25E5Ds5kxIEAE/review",
  reviewWeb: `https://search.google.com/local/writereview?placeid=${PLACE_ID}`,
  /* Search engines' ownership checks. In Google Search Console (URL-prefix property for PROD_URL, "HTML tag"
     method) or Bing Webmaster Tools, copy just the content="…" code, paste it here and redeploy. Empty: no tag. */
  verify: { google: "0S_or_cvv-AcnAeaAYrnEhI0HkwdFD2QiH6tG8Tvjbk", bing: "" },
};
