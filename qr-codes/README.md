# Luna Dine QR codes

All of them open **https://luna-dine.vercel.app/menu**.

| File | Design | Use |
|---|---|---|
| `luna-qr-classic` | Cream menu-card paper, double gold border, "Scan for the menu" | Table cards, counter |
| `luna-qr-night` | Night sky, gold frame with corner ornaments, logo and tagline | Wall poster, entrance, standee |
| `luna-qr-arch` | Pichwai-arch shaped card in gold, "The menu." | Table tents (cut along the arch) |
| `luna-qr-moon` | Round moon sticker with "LUNA DINE ✦ SCAN FOR THE MENU…" around it | Stickers on tables or glass |
| `luna-qr-plain` / `luna-qr.svg` | Just the code with the logo | Send to a printer or designer |

**PNG** files are 2× resolution with transparent corners. **PDF** files are vector, so use those for printing.

## Printing tips
- Print the code at least **2.5 cm (1 inch)** wide. 3–4 cm is better for table cards.
- Keep it **dark on light** as designed. Don't invert the colours or put it on a busy photo.
- Matte paper beats glossy under restaurant lights (less glare).
- **Scan a test print** with a couple of phones (iPhone camera and Google Lens) before printing a batch.

All five were checked with two QR decoders (ZXing and OpenCV), including a blurred, shrunken version.
If the menu's address ever changes, regenerate these with `scripts/qr/make.js` (see the comment at its top).
