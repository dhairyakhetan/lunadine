# Luna Dine review QR codes

All of them open **https://luna-dine.vercel.app/review**, which forwards to the Google review page set as `SITE.review`
in `lib/site.ts`. Because the code points at the site rather than at Google, the destination can be changed at any time
**without reprinting**.

> **To do:** replace `SITE.review` with the restaurant's own review link. In Google Business Profile, choose
> **"Ask for reviews"**, copy the link (looks like `https://g.page/r/XXXXXXXX/review`), paste it into `lib/site.ts`, then redeploy.
> That opens the "write a review" box directly. Until then, `/review` opens Luna Dine on Google Maps, where "Write a review" is one tap away.

| File | Design | Use |
|---|---|---|
| `luna-review-sticker` | Desk plate like the reference photo, in Luna colours: navy band with gold wave and stars, Google G, cream plate | Reception desk, billing counter |
| `luna-review-google` | Same layout in classic Google blue on white | If you want the familiar Google look |
| `luna-review-night` | Night card with gold frame: "Enjoyed your evening?" | Table tents, bill folders |
| `luna-review-moon` | Round sticker: "LOVED IT? ✦ REVIEW US ON GOOGLE ✦ LUNA DINE ✦ SALKIA" | Tables, glass doors, takeaway bags |
| `luna-review-plain` / `luna-review-qr.svg` | Just the code with the logo | Printer or designer |

PNG files are at 2× resolution; the PDF files are vector, so print from those. Print the code at least 2.5 cm wide.
All five were decoded with ZXing and OpenCV, including blurred and shrunken copies.
Regenerate: `node scripts/qr/make.js . qr-codes/review review`.
