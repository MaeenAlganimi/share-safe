# Architecture and decisions

## Website and routes

`src/main.tsx` selects the marketing page at `/` and the interactive redactor at `/app`. Vercel rewrites `/app` and its nested paths to the SPA entry point. The landing page explains the local privacy model, workflow, limitations, and desktop availability. Its app imagery is captured from the running application with Playwright using the built-in synthetic demo; it is not a fabricated interface mockup.

The desktop release area links to stable GitHub release asset paths. Artifact names, byte sizes, and SHA256 values are copied from the desktop build's `manifest.json` to `src/ui/release-manifest.json`, which the landing page imports at build time. The release directory itself is gitignored.

## Data flow

`src/ui/App.tsx` owns the selected image, detector options, current redaction rectangles, and export style. Files arrive through file input, paste, or drag and drop and are decoded as browser `Image` objects. No image is sent to a server. The preview canvas is redrawn from the original on every change; redaction overlays are separate DOM rectangles so the user can inspect and adjust the result. Export redraws the original and applies the current overlays into a PNG blob. Manual rectangles use pointer coordinates scaled from the displayed canvas back to source pixels.

The OCR worker reads screenshot text and word boxes. The app requests Tesseract block output, then `detectors.ts` joins words into a text stream, runs email/phone/card patterns, validates phone lengths and card checksums, maps match spans back to OCR word boxes, and merges boxes that touch. Face detections from MediaPipe use source-image coordinates and join the same overlay list. The synthetic SVG demo is rasterized to PNG before inference so the OCR engine receives a standard raster image.

## Desktop shell and local resources

Electron serves the packaged `dist/` files through its local `sharesafe://app` protocol; it does not navigate to a hosted URL or contact a remote service. This local origin keeps the bundled JavaScript modules and inference workers within one origin while avoiding browser `file://` module restrictions. Vite uses relative asset paths so JavaScript, CSS, OCR assets, language data, and face model are read from the bundle. The window enables `contextIsolation` and `sandbox`, disables Node integration, keeps web security enabled, denies permission requests and new windows, and blocks navigation away from the local scheme. The protocol handler confines file reads to `dist/` and applies a restrictive Content Security Policy allowing same-bundle resources, data/blob images, and the workers needed for local inference.

`npm run build:desktop` builds the Linux x64 AppImage and first tries a Windows x64 NSIS installer. If NSIS cannot run (Wine is absent on this build host), the script builds a Windows x64 ZIP instead. Both outputs are unsigned. The expected stable names are `ShareSafe-x86_64.AppImage`, `ShareSafe-Setup-x64.exe` when NSIS succeeds, or `ShareSafe-win-x64.zip` for the fallback. `desktop/release/manifest.json` records the exact artifact name, byte size, and SHA256. macOS packaging needs a Mac and is not included.

## Key decisions and tradeoffs

- **Local assets:** Tesseract worker/core/English trained data and MediaPipe WASM/face model are copied into `public/`, avoiding runtime dependence on a CDN. The desktop release bundles these with the built web app for offline use.
- **Word-level boxes:** OCR word boxes are expanded to complete words, then nearby boxes merge. This is simple and robust to OCR segmentation but may conceal adjacent non-sensitive text.
- **Conservative card recognition:** A broad digit candidate must pass Luhn. This reduces obvious false positives but is not proof that a number is a payment card.
- **Heuristic phones:** International numbers have many national conventions. A broad candidate plus a 7–15 digit count is dependency-free, but cannot parse every country's numbering rules.
- **Review-first UI:** Detections are suggestions. The user can disable categories, use solid cover, add a manual box, and inspect before download or clipboard copy.
- **Canvas export:** The canvas keeps the original resolution and emits PNG without a server. Browser clipboard image APIs vary and generally require HTTPS.
- **Visual blur:** Blur can sometimes be reconstructed. Use solid boxes for stronger concealment and inspect the exported image.

## Runtime assets and network behavior

The app uses same-bundle paths for `/tesseract/`, `/tessdata/`, `/mediapipe/wasm/`, and `/models/` (resolved relative to the web app or local desktop file). It uses no remote OCR, face-analysis, font, image, or analytics service. Development tooling and package installation naturally contact npm and its configured registry. A hosted website request still reaches the hosting provider and may be included in its normal server logs.
