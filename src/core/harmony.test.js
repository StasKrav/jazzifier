import { describe, it, expect } from 'vitest'
import { analyzeChord, recommendationsFor } from './harmony.js'
import { parseChord } from './parser.js'

describe('analyzeChord — функции в мажоре', () => {
  it('I — тоника', () => {
    const info = analyzeChord(parseChord('Cmaj7'), parseChord('A7'), 'C', 'major')
    expect(info.deg).toBe(1)
    expect(info.func).toContain('тоника')
  })

  it('ii — субдоминанта', () => {
    const info = analyzeChord(parseChord('Dm7'), parseChord('G7'), 'C', 'major')
    expect(info.deg).toBe(2)
    expect(info.func).toContain('субдоминанта')
  })

  it('V7 — доминанта к тонике', () => {
    const info = analyzeChord(parseChord('G7'), parseChord('Cmaj7'), 'C', 'major')
    expect(info.isDominant).toBe(true)
    expect(info.isSecondary).toBe(false)
    expect(info.target).toBe('C')
  })
})

it('ii–V–I распознаётся как связка', () => {
  const d = analyzeChord(parseChord('Dm7'), parseChord('G7'), 'C', 'major')
  const g = analyzeChord(parseChord('G7'), parseChord('Cmaj7'), 'C', 'major')
  expect(d.deg).toBe(2)
  expect(g.isDominant).toBe(true)
  expect(g.target).toBe('C')
})

it('A7 перед Dm7 — вторичная доминанта V/ii', () => {
  const info = analyzeChord(parseChord('A7'), parseChord('Dm7'), 'C', 'major')
  expect(info.isDominant).toBe(true)
  expect(info.isSecondary).toBe(true)
  expect(info.target).toBe('D')
})

it('Db7 перед Cmaj7 — тритоновая замена', () => {
  const info = analyzeChord(parseChord('Db7'), parseChord('Cmaj7'), 'C', 'major')
  expect(info.isDominant).toBe(true)
  expect(info.isTritoneAlready).toBe(true)
})

it('в гармоническом миноре V7 — мажорная доминанта', () => {
  const info = analyzeChord(parseChord('G7'), parseChord('Cm7'), 'C', 'minor')
  expect(info.isDominant).toBe(true)
  expect(info.target).toBe('C')
})

it('C6 в C-мажоре — не заимствование', () => {
  const c = parseChord('C6')
  const info = analyzeChord(c, null, 'C', 'major')
  expect(info.borrowed).toBeFalsy()
})

describe('recommendationsFor', () => {
  it('для трезвучия тоники предлагает септаккорд и параллель', () => {
    const c = parseChord('C')
    const info = analyzeChord(c, parseChord('F'), 'C', 'major')
    const recs = recommendationsFor(c, parseChord('F'), info, 'C', 'major')
    expect(recs.some(r => r.tag === 'seventh')).toBe(true)
    expect(recs.some(r => r.tag === 'parallel')).toBe(true)
  })

  it('для доминанты предлагает тритоновую и уменьшённый', () => {
    const g = parseChord('G7')
    const info = analyzeChord(g, parseChord('Cmaj7'), 'C', 'major')
    const recs = recommendationsFor(g, parseChord('Cmaj7'), info, 'C', 'major')
    expect(recs.some(r => r.tag === 'tritone')).toBe(true)
    expect(recs.some(r => r.tag === 'dim')).toBe(true)
  })

  it('каждая рекомендация имеет kind и payload с chord или chords', () => {
    const c = parseChord('C')
    const info = analyzeChord(c, null, 'C', 'major')
    const recs = recommendationsFor(c, null, info, 'C', 'major')
    for (const r of recs) {
      expect(r).toHaveProperty('kind')
      expect(r.payload).toBeDefined()
      const hasOne = typeof r.payload.chord === 'string'
      const hasMany = Array.isArray(r.payload.chords) && r.payload.chords.length > 0
      expect(hasOne || hasMany).toBe(true)
      expect(['replace', 'insertBefore', 'insertAfter']).toContain(r.kind)
    }
  })
})