export type Kind = 'email' | 'phone' | 'card' | 'face' | 'manual'
export type Redaction = { id: string; kind: Kind; x: number; y: number; w: number; h: number; label?: string }
export type WordBox = { text: string; x0: number; y0: number; x1: number; y1: number }

export function luhnValid(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i])
    if (double) { n *= 2; if (n > 9) n -= 9 }
    sum += n
    double = !double
  }
  return sum % 10 === 0
}

const patterns: Record<'email' | 'phone' | 'card', RegExp> = {
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  // Broad international candidate; validation below requires 7–15 digits.
  phone: /(?<![\w])(?:\+?\d[\d\s().-]{5,}\d)(?![\w])/g,
  card: /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/g,
}

function detectedMatches(text: string): { kind: 'email' | 'phone' | 'card'; start: number; end: number }[] {
  const matches: { kind: 'email' | 'phone' | 'card'; start: number; end: number }[] = []
  for (const kind of ['email', 'phone', 'card'] as const) {
    patterns[kind].lastIndex = 0
    for (const m of text.matchAll(patterns[kind])) {
      const value = m[0]
      if (kind === 'phone' && (value.replace(/\D/g, '').length < 7 || value.replace(/\D/g, '').length > 15)) continue
      if (kind === 'card' && !luhnValid(value)) continue
      matches.push({ kind, start: m.index ?? 0, end: (m.index ?? 0) + value.length })
    }
  }
  return matches
}

export function mergeBoxes(boxes: Redaction[], padding = 2): Redaction[] {
  const result: Redaction[] = []
  for (const source of boxes) {
    let current = { ...source }
    let merged = true
    while (merged) {
      merged = false
      for (let i = result.length - 1; i >= 0; i--) {
        const other = result[i]
        const overlap = current.x <= other.x + other.w + padding && current.x + current.w + padding >= other.x && current.y <= other.y + other.h + padding && current.y + current.h + padding >= other.y
        if (overlap) {
          const x = Math.min(current.x, other.x), y = Math.min(current.y, other.y)
          current = { ...current, x, y, w: Math.max(current.x + current.w, other.x + other.w) - x, h: Math.max(current.y + current.h, other.y + other.h) - y }
          result.splice(i, 1)
          merged = true
        }
      }
    }
    result.push(current)
  }
  return result
}

export function detectTextBoxes(words: WordBox[], enabled: { email: boolean; phone: boolean; card: boolean }): Redaction[] {
  const text = words.map(w => w.text).join(' ')
  const spans = detectedMatches(text).filter(m => enabled[m.kind])
  const offsets: { start: number; end: number; word: WordBox }[] = []
  let cursor = 0
  for (const word of words) { offsets.push({ start: cursor, end: cursor + word.text.length, word }); cursor += word.text.length + 1 }
  const boxes: Redaction[] = []
  for (const match of spans) {
    const selected = offsets.filter(o => o.end > match.start && o.start < match.end).map(o => o.word)
    if (!selected.length) continue
    const x0 = Math.min(...selected.map(w => w.x0)), y0 = Math.min(...selected.map(w => w.y0))
    const x1 = Math.max(...selected.map(w => w.x1)), y1 = Math.max(...selected.map(w => w.y1))
    boxes.push({ id: `${match.kind}-${match.start}`, kind: match.kind, x: x0, y: y0, w: x1 - x0, h: y1 - y0 })
  }
  return mergeBoxes(boxes)
}
