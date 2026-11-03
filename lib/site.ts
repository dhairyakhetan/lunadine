/* Absolute site URL for Open Graph images, the sitemap and structured data.
   On Vercel it comes from the project's production domain at build time (VERCEL_PROJECT_PRODUCTION_URL,
   e.g. luna-dine.vercel.app, or the custom domain once one is set as production), so share previews always
   point at the live site. The fallback is only for local builds.
   Server-only: client components don't get this env var, so pass values down as props (see MenuBrowser). */
const PROD_HOST = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE = {
  name: "Luna Dine",
  tagline: "Beyond Fine Dining",
  url: PROD_HOST ? `https://${PROD_HOST}` : "https://lunadine.vercel.app",
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
};
