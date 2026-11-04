/* The live site address. Used for Open Graph images, og:url, the sitemap, robots.txt and structured data,
   and as the host where review mode stays hidden (see MenuBrowser). Set explicitly rather than read from
   Vercel's env, because with several domains attached Vercel can report an old one.
   Change it here if the domain changes (e.g. a custom domain), then redeploy. */
const PROD_URL = "https://luna-dine.vercel.app";

export const SITE = {
  name: "Luna Dine",
  tagline: "Beyond Fine Dining",
  url: PROD_URL,
  phone: "+91 74397 24362",
  tel: "tel:+917439724362",
  whatsapp: "https://wa.me/917439724362",
  email: "admin.lunadine@gmail.com",
  address: "140/2 Salkia School Road, opp. Ghasbagan Maidan, near Sansaraa, Howrah 711101",
  maps: "https://www.google.com/maps/search/?api=1&query=22.59446,88.34321",
  mapEmbed: "https://maps.google.com/maps?q=22.59446,88.34321&z=17&output=embed",
  instagram: "https://www.instagram.com/lunadine_exoticmulticuisine/",
  facebook: "https://www.facebook.com/profile.php?id=61595533162677",
  geo: { lat: 22.59446, lng: 88.34321 },
  /* Where luna-dine.vercel.app/review sends people (the review QR codes point there, so this can change without
     reprinting; app/review/route.ts, redeploy to apply). Replace with the restaurant's own Google review link: Google Business Profile → "Ask for reviews"
     → copy link (looks like https://g.page/r/XXXXXXXX/review). Until then: the Google Maps listing. */
  review: "https://www.google.com/maps/search/?api=1&query=Luna%2BDine%2BSalkia%2BHowrah",
};
