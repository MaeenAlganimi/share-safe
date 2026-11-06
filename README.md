# share-safe

A browser-only screenshot redactor. Paste (Ctrl+V), drop, or select a screenshot, scan for email addresses, international phone numbers, Luhn-valid payment card numbers, and faces, then review and export a PNG. You can turn each detector off, choose blur or a solid cover, and draw extra rectangles by hand.

## Privacy model

Image decoding, OCR, face detection, redaction, and export run in your browser. The app does not upload images or need an API key. OCR language data, OCR worker/runtime, and face model/runtime are included in this repository under `public/`; app use makes no third-party runtime requests. Hosting providers may still receive ordinary page requests and their normal server logs. Clipboard image writing requires a secure context (HTTPS or localhost) and browser support.

The bundled demo is an SVG-generated synthetic account card. Its names, email domain, phone, and payment card are fabricated. The sample is not evidence of detector accuracy.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Run the quality checks with `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

## Limitations

OCR depends on image quality, text size, language, and orientation; this build includes English only. Phone matching is heuristic and can miss unusual formatting or match non-phone digit strings. Card matching uses Luhn validation but does not establish that a number is an issued card. Face detection can miss faces, especially small, rotated, occluded, or low-resolution faces. Always inspect the preview before sharing. Redaction boxes can cover nearby content when OCR groups words. Blur is a visual treatment and may not be safe against all reconstruction methods; use solid boxes for stronger concealment. Manual boxes are available for missed areas.

## Built with AI assistance

This project was built with AI assistance. Human review and validation are still needed, especially before relying on redactions for sensitive material.

## License

MIT. See [LICENSE](LICENSE).
