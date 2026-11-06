import { ChevronDown } from 'lucide-react'
import downloadManifest from './release-manifest.json'
import './landing.css'

type Artifact = { name: string; size: number; sha256: string }
const manifest = downloadManifest as { linux?: Artifact; windows?: Artifact }
const releaseBase = 'https://github.com/MaeenAlganimi/share-safe/releases/latest/download/'
const downloads = [
  { platform: 'Linux', file: manifest.linux?.name ?? 'ShareSafe-x86_64.AppImage', detail: 'Linux x86_64, AppImage', artifact: manifest.linux },
  { platform: 'Windows', file: manifest.windows?.name ?? 'ShareSafe-win-x64.zip', detail: 'Windows x64, portable ZIP', artifact: manifest.windows },
]
const faqs = [
  ['What does ShareSafe detect?', 'It can suggest redactions for email addresses, phone number candidates, Luhn-valid card number candidates and faces. Detection can miss details, so review the image before sharing.'],
  ['Does anything leave my device?', 'No. Text recognition, face detection and redaction run on your device. ShareSafe does not upload screenshots or send them to a remote inference service.'],
  ['Is blur enough to hide sensitive details?', 'Blur is a visual treatment and may not prevent reconstruction in every case. For stronger concealment, use a solid box and inspect the exported image.'],
  ['Can I use it offline?', 'The desktop app includes the application and detection models, so it works offline. The browser app needs the site loaded first.'],
  ['Which downloads are available?', 'Linux is an AppImage. Windows is a portable ZIP, not an installer. Both builds are unsigned, so Windows SmartScreen may warn when opening the app. macOS is coming later.'],
]
function size(bytes: number) { return `${(bytes / 1024 / 1024).toFixed(1)} MB` }

export default function Landing() {
  return <main className="site" id="top">
    <header className="site-nav"><a className="site-brand" href="/" aria-label="ShareSafe home"><span className="brandmark">S</span><span>ShareSafe</span></a><nav aria-label="Main navigation"><a href="#features">Features</a><a href="#download">Download</a><a href="https://github.com/MaeenAlganimi/share-safe" target="_blank" rel="noreferrer">GitHub</a></nav><a className="nav-cta" href="#download">Download</a></header>
    <section className="site-hero"><div className="hero-copy"><h1>Check a screenshot before you share it.</h1><p>ShareSafe finds personal details and faces in screenshots, then lets you review what to cover. Detection and redaction happen on your device; nothing leaves it.</p><div className="hero-buttons"><a className="button-primary" href="#download">Download ShareSafe</a><a className="button-quiet" href="/app">Open the app</a></div></div><figure className="hero-art"><img src="/screenshots/share-safe-demo.png" alt="ShareSafe desktop app showing fabricated contact details detected for review"/><figcaption>Illustrative interface with fabricated details</figcaption></figure></section>
    <section className="studio-section who" aria-labelledby="who-title"><h2 id="who-title">For people who share screenshots at work.</h2><p>Support teams, product teams and anyone sending a screenshot can use ShareSafe to check for details they meant to keep private. The original stays untouched while you review a separate redacted copy.</p></section>
    <section className="studio-section feature-section" id="features"><h2>What ShareSafe does</h2><dl className="feature-list"><div><dt>Find likely personal details</dt><dd>On-device text recognition checks for email addresses, phone numbers and card number candidates. Face detection can find faces, too.</dd></div><div><dt>Review every suggestion</dt><dd>Choose what to cover, switch between blur and solid boxes, or draw a redaction where you need one.</dd></div><div><dt>Export a clean copy</dt><dd>Save a PNG or copy it to your clipboard. ShareSafe leaves the source image as it was.</dd></div><div><dt>Keep processing local</dt><dd>The desktop app includes its OCR and face detection models and works without an internet connection.</dd></div></dl></section>
    <section className="studio-section how"><h2>How it works</h2><div><p>First, drop in a screenshot or choose a file.</p><p>Then, review the suggested areas and add, remove or adjust covers.</p><p>After that, export a new PNG or copy it to your clipboard.</p></div></section>
    <section className="studio-section download-section" id="download"><div className="download-intro"><h2>Download ShareSafe</h2><p>Free desktop builds for Linux and Windows. Files are unsigned; Windows SmartScreen may warn when you open the app.</p></div><div className="download-list">{downloads.map(({ platform, file, detail, artifact }) => <div className="download-row" key={platform}><div><h3>{platform}</h3><p>{detail}</p><p className="integrity">{artifact ? size(artifact.size) : 'Size unavailable'} <span>SHA256</span> <code>{artifact?.sha256 ?? 'Unavailable'}</code></p></div><a className="button-primary download-button" href={`${releaseBase}${file}`}>Download</a></div>)}<div className="download-row coming"><div><h3>macOS</h3><p>Coming later. A Mac build is required.</p></div><span>Coming later</span></div></div><p className="download-note">Windows is distributed as a portable ZIP. The incomplete setup executable is not offered. Both builds are unsigned.</p></section>
    <section className="studio-section faq-section" id="faq"><h2>Questions</h2><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={17} aria-hidden="true"/></summary><p>{answer}</p></details>)}</div></section>
    <footer className="site-footer"><a className="site-brand" href="/"><span className="brandmark">S</span><span>ShareSafe</span></a><p>Built with AI assistance. Please review redactions before sharing.</p><a href="https://github.com/MaeenAlganimi/share-safe" target="_blank" rel="noreferrer">GitHub</a><a href="/app">Open the app</a></footer>
  </main>
}
