import { describe, it, expect } from 'vitest'
import { approachesFor } from './approaches.js'
import { parseChord } from './parser.js'

describe('approachesFor — ii–V к мажорной цели', () => {
  it('Cmaj7 в C: Dm7 → G7', () => {
    const target = parseChord('Cmaj7')
    const list = approachesFor(target, { key: 'C', mode: 'major' })
    const iiV = list.find(a => a.id.startsWith('iiV:'))
    expect(iiV).toBeDefined()
    expect(iiV.payload.chords).toEqual(['Dm7', 'G7'])
    expect(iiV.kind).toBe('insertBefore')
  })


  it('Fmaj7 в C: Gm7 → C7', () => {
    const target = parseChord('Fmaj7')
    const list = approachesFor(target, { key: 'C', mode: 'major' })
    const iiV = list.find(a => a.id.startsWith('iiV:'))
    expect(iiV.payload.chords).toEqual(['Gm7', 'C7'])
  })
})

describe('approachesFor — minor ii–V к минорной цели', () => {
  it('Am7 в C: minor ii–V Bm7b5 → E7#9', () => {
  const target = parseChord('Am7')
  const list = approachesFor(target, { key: 'C', mode: 'major' })
  const minor = list.find(a => a.id.startsWith('minor-iiV:'))
  expect(minor).toBeDefined()
  expect(minor.payload.chords[0]).toBe('Bm7b5')
  expect(minor.payload.chords[1]).toMatch(/^E7/)
})
})

describe('approachesFor — пустой случай', () => {
  it('нет цели — пустой массив', () => {
    expect(approachesFor(null, {})).toEqual([])
  })
})