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
  tagline: "Beyond Fine Dining",
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
     reprinting; app/review/route.ts, redeploy to apply): the "write a review" box once PLACE_ID is set, otherwise
     the Maps listing. A Business Profile "Ask for reviews" link (https://g.page/r/…/review) also works here. */
  review: PLACE_ID
    ? `https://search.google.com/local/writereview?placeid=${PLACE_ID}`
    : "https://www.google.com/maps/search/?api=1&query=Luna%2BDine%2BSalkia%2BHowrah",
};
