# ShareSafe

ShareSafe is a free screenshot redactor for web and desktop. It suggests redactions for email addresses, phone number candidates, Luhn-valid payment card candidates, and faces. Review the suggestions, choose blur or a solid cover, add manual rectangles, then export a PNG or copy it to the clipboard.

## Use ShareSafe

- **Web app:** visit `/app` on the hosted site. The root path `/` is the product website.
- **Linux x86_64:** [Download ShareSafe-x86_64.AppImage](https://github.com/MaeenAlganimi/share-safe/releases/latest/download/ShareSafe-x86_64.AppImage) · AppImage · 157.2 MB · SHA256 `3b83f81cbab1d19f2271ae59717ecb54a3cf4696236c6567b90807e2add0e6ba`
- **Windows x64:** [Download ShareSafe-Setup-x64.exe](https://github.com/MaeenAlganimi/share-safe/releases/latest/download/ShareSafe-Setup-x64.exe) · setup installer · 121.6 MB · SHA256 `a133aeff29b2adeea16ad17001b8297a9cb30ad3597f6f2715d4452ada2d0a65`

Windows is a one-click setup .exe that installs for your user and adds Start Menu and desktop shortcuts. Builds are not code-signed, so SmartScreen may warn: choose More info → Run anyway. Linux is the AppImage `ShareSafe-x86_64.AppImage`. macOS is coming later. Release downloads are hosted as public GitHub release assets; the files built locally are in ignored `desktop/release/`.

The download names, sizes, and SHA256 values shown on the website come from [`src/ui/release-manifest.json`](src/ui/release-manifest.json). The build writes the matching full manifest to `desktop/release/manifest.json`.

## Privacy model

Image decoding, OCR, face detection, redaction, and export run on the user's device. The web app does not upload images or need an API key. OCR language data, OCR worker/runtime, and face model/runtime are bundled in this repository; the desktop app bundles the built site and these local assets for offline use. There is no analytics or remote inference service. Hosting providers still receive ordinary web page requests and their normal server logs. Clipboard image writing requires a secure context (HTTPS or localhost) and browser support.

The synthetic demo is generated from fabricated details. Its `example.test` email domain, reserved example phone number, and test card are not real personal information and do not demonstrate detector accuracy.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Run checks with `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

## Build the desktop downloads

```sh
npm run build:desktop
```

This builds the Linux x64 AppImage, and the Windows `win-unpacked` app. The Windows installer is compiled with the native Linux `makensis` from [`desktop/installer.nsi`](desktop/installer.nsi) (no Wine needed): build `win-unpacked` with electron-builder, then run `makensis -DPRODUCT=... -DAPPID=... -DVERSION=1.0.1 -DSRC=<win-unpacked> -DOUTFILE=<Setup.exe> desktop/installer.nsi`. The resulting artifacts and full size/SHA256 manifest are written to `desktop/release/`; the website's committed copy at `src/ui/release-manifest.json` is refreshed by the build. Builds are unsigned. macOS packaging requires a Mac and is not built here.

## Limitations

OCR depends on image quality, text size, language, and orientation; this build includes English only. Phone matching is heuristic and can miss unusual formatting or match non-phone digit strings. Card matching uses Luhn validation but does not establish that a number is an issued card. Face detection can miss faces, especially small, rotated, occluded, or low-resolution faces. Always inspect the preview before sharing. Redaction boxes can cover nearby content when OCR groups words. Blur is a visual treatment and may not be safe against all reconstruction methods; use solid boxes for stronger concealment. Manual boxes are available for missed areas.

## Built with AI assistance

This project was built with AI assistance. Human review and validation are still needed, especially before relying on redactions for sensitive material.

## License

MIT. See [LICENSE](LICENSE).
