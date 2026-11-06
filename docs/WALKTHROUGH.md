# Architecture and decisions

## Data flow

`App.tsx` owns the selected image, detector options, current redaction rectangles, and export style. Files arrive through file input, paste, or drag and drop and are decoded as browser `Image` objects. No image is sent to a server. The preview canvas is redrawn from the original on every change; redaction overlays are separate DOM rectangles so the user can inspect and adjust the result. Export redraws the original and applies the current overlays into a PNG blob. Manual rectangles use pointer coordinates scaled from the displayed canvas back to source pixels.

The OCR worker reads the screenshot into word text and pixel boxes. `detectors.ts` joins words into a text stream, runs email/phone/card patterns, validates phone lengths and card checksums, maps match character spans back to OCR word boxes, and merges boxes that touch. Face detections from MediaPipe are returned in source-image coordinates and join the same overlay list.

## Key decisions and tradeoffs

- **Local assets:** Tesseract worker/core/English trained data and MediaPipe WASM/face model are copied into `public/`, avoiding runtime dependence on a CDN. This increases repository/deployment size but makes runtime network behavior easier to explain and use offline after the app is served.
- **Word-level boxes:** OCR boxes are expanded to whole words, then nearby boxes merge. This is simple and robust to OCR's word segmentation but may conceal adjacent non-sensitive text.
- **Conservative card recognition:** A broad digit candidate must pass Luhn. It reduces obvious false positives but is not proof that the number is a payment card.
- **Heuristic phones:** International numbers have many national conventions. A broad candidate plus 7–15 digit count is dependency-free, but cannot parse every country's numbering rules.
- **Review-first UI:** Detections are suggestions. The user can disable categories, use solid cover, add a manual box, and inspect before download or clipboard copy.
- **Canvas export:** The canvas keeps the original resolution and emits PNG without a server. Browser clipboard image APIs vary and generally require HTTPS.

## Runtime assets

All runtime model/worker assets are served from same-origin paths: `/tesseract/`, `/tessdata/`, `/mediapipe/wasm/`, and `/models/`. No remote OCR, face-analysis, font, or image service is used. Development tooling and package installation naturally contact npm and its configured registry.
