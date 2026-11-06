import { useCallback, useEffect, useRef, useState } from 'react'
import { createWorker } from 'tesseract.js'
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'
import { ShieldCheck, Upload, Clipboard, Download, Sun, Moon, RotateCcw, MousePointer2, LoaderCircle, Sparkles } from 'lucide-react'
import { detectTextBoxes, type Redaction, type WordBox } from '../detectors'

const demoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="680"><rect width="1120" height="680" fill="#f3f5f7"/><rect x="80" y="60" width="960" height="560" rx="24" fill="white"/><rect x="80" y="60" width="960" height="84" rx="24" fill="#182831"/><text x="126" y="115" fill="white" font-family="Arial" font-size="28" font-weight="bold">Account overview</text><text x="850" y="114" fill="#bdced4" font-family="Arial" font-size="18">DEMO PROFILE</text><text x="130" y="213" fill="#5c6c72" font-family="Arial" font-size="17">CONTACT EMAIL</text><text x="130" y="254" fill="#1c2b32" font-family="Arial" font-size="25">morgan.lee@example.test</text><text x="130" y="322" fill="#5c6c72" font-family="Arial" font-size="17">PHONE NUMBER</text><text x="130" y="363" fill="#1c2b32" font-family="Arial" font-size="25">+1 (202) 555-0148</text><text x="130" y="431" fill="#5c6c72" font-family="Arial" font-size="17">PAYMENT CARD</text><text x="130" y="472" fill="#1c2b32" font-family="Arial" font-size="25">4111 1111 1111 1111</text><circle cx="843" cy="341" r="79" fill="#d6e4e6"/><circle cx="843" cy="314" r="29" fill="#b9755b"/><path d="M780 376 Q843 318 906 376 L918 422 L768 422Z" fill="#477477"/><text x="778" y="478" fill="#5c6c72" font-family="Arial" font-size="17">PROFILE PHOTO</text><rect x="130" y="526" width="238" height="54" rx="12" fill="#dbf2e8"/><text x="163" y="561" fill="#167451" font-family="Arial" font-size="17" font-weight="bold">All systems normal</text></svg>`
type Detectors = { email: boolean; phone: boolean; card: boolean; face: boolean }
const initial: Detectors = { email: true, phone: true, card: true, face: true }
const names: { key: keyof Detectors; label: string; icon: string }[] = [{ key: 'email', label: 'Email addresses', icon: '✉' }, { key: 'phone', label: 'Phone numbers', icon: '⌕' }, { key: 'card', label: 'Card numbers', icon: '▤' }, { key: 'face', label: 'Faces', icon: '◉' }]

export default function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [boxes, setBoxes] = useState<Redaction[]>([])
  const [enabled, setEnabled] = useState(initial)
  const [mode, setMode] = useState<'blur' | 'solid'>('blur')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Add a screenshot to get started.')
  const [light, setLight] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [start, setStart] = useState<{x:number;y:number}|null>(null)
  const [manual, setManual] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadImage = useCallback((src: string, name: string) => {
    const img = new Image()
    img.onload = () => { if (src.startsWith('blob:')) URL.revokeObjectURL(src); setImage(img); setSourceName(name); setBoxes([]); setStatus('Screenshot loaded. Detect sensitive details to review.') }
    img.onerror = () => setStatus('Could not open that image. Try a PNG, JPEG, or WebP screenshot.')
    img.src = src
  }, [])
  const openFile = useCallback((file?: File) => { if (file && file.type.startsWith('image/')) loadImage(URL.createObjectURL(file), file.name) }, [loadImage])

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => { const item = [...(event.clipboardData?.items ?? [])].find(i => i.type.startsWith('image/')); if (item) { event.preventDefault(); const f = item.getAsFile(); if (f) openFile(f) } }
    const onDrop = (event: DragEvent) => { event.preventDefault(); openFile(event.dataTransfer?.files[0]) }
    const onDrag = (event: DragEvent) => event.preventDefault()
    window.addEventListener('paste', onPaste); window.addEventListener('drop', onDrop); window.addEventListener('dragover', onDrag)
    return () => { window.removeEventListener('paste', onPaste); window.removeEventListener('drop', onDrop); window.removeEventListener('dragover', onDrag) }
  }, [openFile])

  const runDetection = async () => {
    if (!image) return
    setBusy(true); setStatus('Scanning text locally…')
    try {
      const worker = await createWorker('eng', 1, { workerPath: '/tesseract/worker.min.js', langPath: '/tessdata', corePath: '/tesseract/tesseract-core', logger: m => { if (m.status === 'recognizing text') setStatus(`Reading screenshot… ${Math.round((m.progress ?? 0) * 100)}%`) } })
      const result = await worker.recognize(image)
      await worker.terminate()
      const words: WordBox[] = (result.data.blocks ?? []).flatMap(block => block.paragraphs.flatMap(paragraph => paragraph.lines.flatMap(line => line.words))).map(w => ({ text: w.text, x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 }))
      let found = detectTextBoxes(words, enabled)
      if (enabled.face) {
        try {
          const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
          const detector = await FaceDetector.createFromOptions(vision, { baseOptions: { modelAssetPath: '/models/face_detector.tflite' }, runningMode: 'IMAGE' })
          const faces = detector.detect(image).detections.map((d, i) => { const b = d.boundingBox!; return { id: `face-${i}`, kind: 'face' as const, x: b.originX, y: b.originY, w: b.width, h: b.height } })
          found = [...found, ...faces]; detector.close()
        } catch { setStatus('Text scan complete. Face model unavailable; text detections are ready.') }
      }
      setBoxes(found); setStatus(`${found.length} area${found.length === 1 ? '' : 's'} found. Review before exporting.`)
    } catch (error) { console.error(error); setStatus('Scan could not finish. The local OCR assets may still be downloading; retry in a moment.') }
    finally { setBusy(false) }
  }

  const paint = useCallback((includeBoxes = true) => {
    const canvas = canvasRef.current
    if (!canvas || !image) return null
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(image, 0, 0)
    if (includeBoxes) for (const b of boxes) {
      if (mode === 'solid') { ctx.fillStyle = '#111820'; ctx.fillRect(b.x, b.y, b.w, b.h) }
      else { const crop = ctx.getImageData(Math.max(0,b.x), Math.max(0,b.y), Math.max(1,b.w), Math.max(1,b.h)); const off = document.createElement('canvas'); off.width=crop.width;off.height=crop.height;off.getContext('2d')!.putImageData(crop,0,0); ctx.save();ctx.filter='blur(12px)';ctx.drawImage(off,b.x,b.y,b.w,b.h);ctx.restore();ctx.fillStyle='rgba(14,24,32,.25)';ctx.fillRect(b.x,b.y,b.w,b.h) }
    }
    return canvas
  }, [image, boxes, mode])
  useEffect(() => { paint() }, [paint])
  const exportPng = () => { const c=paint(); if (!c) return; c.toBlob(blob => { if (!blob) return; const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='share-safe-redacted.png';a.click();URL.revokeObjectURL(a.href) },'image/png') }
  const copyImage = async () => { const c=paint(); if (!c) return; c.toBlob(async b => { if (b) try { await navigator.clipboard.write([new ClipboardItem({'image/png':b})]); setStatus('Redacted screenshot copied to clipboard.') } catch { setStatus('Clipboard image access was blocked by the browser. Use Download PNG instead.') } },'image/png') }
  const point = (e: React.PointerEvent) => { const rect=(e.currentTarget as HTMLCanvasElement).getBoundingClientRect(); return {x:Math.round((e.clientX-rect.left)*image!.naturalWidth/rect.width),y:Math.round((e.clientY-rect.top)*image!.naturalHeight/rect.height)} }
  const pointerDown = (e: React.PointerEvent) => { if (!manual || !image) return; const p=point(e);setStart(p);setDrawing(true);(e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId) }
  const pointerUp = (e: React.PointerEvent) => { if (!drawing || !start) return; const p=point(e); const x=Math.min(start.x,p.x),y=Math.min(start.y,p.y); if(Math.abs(p.x-start.x)>4&&Math.abs(p.y-start.y)>4)setBoxes(v=>[...v,{id:`manual-${Date.now()}`,kind:'manual',x,y,w:Math.abs(p.x-start.x),h:Math.abs(p.y-start.y)}]);setDrawing(false);setStart(null) }

  const demo = () => loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(demoSvg)}`, 'Synthetic demo')
  return <main className={light?'app light':'app'}>
    <header className="topbar"><a className="brand" href="#" aria-label="share-safe home"><span className="brandmark"><ShieldCheck size={21}/></span><span>share<span className="brand-accent">safe</span></span></a><div className="top-actions"><span className="local-pill"><i/>On-device processing</span><button className="icon-button" onClick={()=>setLight(v=>!v)} aria-label={light?'Switch to dark theme':'Switch to light theme'}>{light?<Moon size={18}/>:<Sun size={18}/>}</button></div></header>
    <section className="hero"><div className="eyebrow"><span/> PRIVATE BY DESIGN</div><h1>Your screenshot.<br/><em>Your business.</em></h1><p>Find and hide sensitive details before you share. Everything stays in this browser.</p></section>
    <section className="workspace">
      <aside className="panel controls"><div className="panel-heading"><div><span className="step">01</span><h2>Prepare</h2></div><span className="subtle">Choose what to find</span></div>
        <div className="toggle-list">{names.map(({key,label,icon})=><label className="toggle-row" key={key}><span className="type-icon">{icon}</span><span>{label}</span><input type="checkbox" checked={enabled[key]} onChange={e=>{const checked=e.target.checked;setEnabled(v=>({...v,[key]:checked}));if(!checked)setBoxes(v=>v.filter(b=>b.kind!==key))}}/><span className="switch"/></label>)}</div>
        <div className="divider"/><div className="field-label">REDACTION STYLE</div><div className="segmented"><button className={mode==='blur'?'selected':''} onClick={()=>setMode('blur')}>Blur</button><button className={mode==='solid'?'selected':''} onClick={()=>setMode('solid')}>Solid box</button></div>
        <button className={`manual-button ${manual?'active':''}`} onClick={()=>setManual(v=>!v)}><MousePointer2 size={16}/>{manual?'Drawing enabled':'Draw a redaction'}<span>{manual?'Drag on image':'+'}</span></button>
        <button className="scan-button" onClick={runDetection} disabled={!image||busy}>{busy?<LoaderCircle size={17} className="spin"/>:<Sparkles size={17}/>} {busy?'Scanning…':'Find sensitive info'}</button>
        <p className="privacy-note"><ShieldCheck size={15}/> Your image never leaves this device.</p>
      </aside>
      <section className="panel preview-panel"><div className="panel-heading"><div><span className="step">02</span><h2>Review & export</h2></div>{image&&<span className="count-badge">{boxes.length} covered</span>}</div>
        {!image ? <div className="dropzone" onClick={()=>fileRef.current?.click()} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')fileRef.current?.click()}}><div className="upload-icon"><Upload size={22}/></div><strong>Drop your screenshot here</strong><span>or click to browse files</span><kbd><Clipboard size={13}/> Ctrl + V to paste</kbd><div className="drop-bottom"><span>PNG, JPG, or WebP</span><span>Stays on your device</span></div></div> : <div className={`image-stage ${manual?'is-manual':''}`}><canvas ref={canvasRef} onPointerDown={pointerDown} onPointerUp={pointerUp} aria-label={`Screenshot preview: ${sourceName}`}/>{boxes.map(b=><div key={b.id} className={`box-outline kind-${b.kind}`} style={{left:`${100*b.x/image.naturalWidth}%`,top:`${100*b.y/image.naturalHeight}%`,width:`${100*b.w/image.naturalWidth}%`,height:`${100*b.h/image.naturalHeight}%`}} aria-label={`${b.kind} redaction`}/>)}</div>}
        <div className="preview-footer"><span className="file-label">{image?<><span className="file-dot"/>{sourceName}</>:'Ready when you are'}</span><div className="footer-actions">{image&&<><button className="text-button" onClick={()=>{setImage(null);setBoxes([]);setStatus('Add a screenshot to get started.')}}><RotateCcw size={14}/> Replace</button><button className="outline-button" onClick={copyImage}><Clipboard size={15}/> Copy</button><button className="primary-small" onClick={exportPng}><Download size={15}/> Export PNG</button></>}</div></div>
        <div className="statusline" role="status"><span className="status-dot"/>{status}</div>
      </section>
    </section>
    <section className="below"><button className="demo-link" onClick={demo}><Sparkles size={15}/> Try the synthetic demo</button><span>Fake details only · no real personal data</span><div className="legend"><span><i className="legend-blur"/> Detected</span><span><i className="legend-manual"/> Manual</span></div></section>
    <footer><span>share-safe <b>·</b> Private by default.</span><span>Built for safer sharing <ShieldCheck size={14}/></span></footer>
    <input ref={fileRef} hidden type="file" accept="image/*" onChange={e=>openFile(e.target.files?.[0])}/>
  </main>
}
