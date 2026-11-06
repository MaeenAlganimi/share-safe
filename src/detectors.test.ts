import { describe, expect, it } from 'vitest'
import { detectTextBoxes, luhnValid, mergeBoxes, type Redaction } from './detectors'

describe('Luhn validation', () => {
  it('accepts valid and rejects invalid payment card numbers', () => {
    expect(luhnValid('4111 1111 1111 1111')).toBe(true)
    expect(luhnValid('4111 1111 1111 1112')).toBe(false)
    expect(luhnValid('123')).toBe(false)
  })
})
describe('text detector', () => {
  it('finds email, international phone, and Luhn-valid card word spans', () => {
    const words = ['Reach', 'me', 'at', 'morgan@example.test', 'or', '+44', '(20)', '7946', '0958', 'card', '4111', '1111', '1111', '1111'].map((text, i) => ({ text, x0: i * 10, y0: 2, x1: i * 10 + 8, y1: 12 }))
    const boxes = detectTextBoxes(words, { email: true, phone: true, card: true })
    expect(boxes.length).toBe(3)
    expect(boxes.map(b => b.kind)).toEqual(expect.arrayContaining(['email', 'phone', 'card']))
  })
  it('respects detector toggles', () => {
    const boxes = detectTextBoxes([{ text: 'a@b.test', x0: 0, y0: 0, x1: 20, y1: 10 }], { email: false, phone: true, card: true })
    expect(boxes).toHaveLength(0)
  })
})
describe('box merging', () => {
  const box = (id: string, x: number, y: number): Redaction => ({ id, kind: 'email', x, y, w: 10, h: 10 })
  it('joins overlapping or adjacent boxes and keeps separated boxes', () => {
    const result = mergeBoxes([box('a', 0, 0), box('b', 9, 0), box('c', 40, 40)], 1)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ x: 0, y: 0, w: 19, h: 10 })
  })
})
