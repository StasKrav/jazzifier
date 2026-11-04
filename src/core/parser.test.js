import { describe, it, expect } from 'vitest'
import { parseChord, parseSequence } from './parser.js'

describe('parseChord', () => {
  it('распознаёт мажорное трезвучие', () => {
    const c = parseChord('C')
    expect(c).toMatchObject({ root: 'C', type: 'maj' })
  })

  it('распознаёт maj7 через "maj7" и "maj"', () => {
    expect(parseChord('Cmaj7')).toMatchObject({ root: 'C', type: 'maj7' })
    expect(parseChord('Cmaj')).toMatchObject({ root: 'C', type: 'maj' })
  })

  it('распознаёт минор и m7', () => {
    expect(parseChord('Am')).toMatchObject({ root: 'A', type: 'm' })
    expect(parseChord('Am7')).toMatchObject({ root: 'A', type: 'm7' })
  })

  it('распознаёт m7b5 и dim7', () => {
    expect(parseChord('Bm7b5')).toMatchObject({ root: 'B', type: 'm7b5' })
    expect(parseChord('Bdim7')).toMatchObject({ root: 'B', type: 'dim7' })
    expect(parseChord('Bo7')).toMatchObject({ root: 'B', type: 'dim7' })
  })

  it('распознаёт секстаккорды', () => {
    expect(parseChord('C6')).toMatchObject({ root: 'C', type: '6' })
    expect(parseChord('Am6')).toMatchObject({ root: 'A', type: 'm6' })
    expect(parseChord('C6/9')).toMatchObject({ root: 'C', type: '6/9' })
    expect(parseChord('Am6/9')).toMatchObject({ root: 'A', type: 'm6/9' })
  })

  it('распознаёт доминантсептаккорд и альтерации', () => {
    const g = parseChord('G7')
    expect(g).toMatchObject({ root: 'G', type: '7' })
    const alt = parseChord('G7#9b13')
    expect(alt).toMatchObject({ root: 'G', type: '7' })
    expect(alt.altered).toContain('#9')
    expect(alt.altered).toContain('#5/b13')
  })

  it('распознаёт sus', () => {
    expect(parseChord('Gsus4')).toMatchObject({ root: 'G', type: 'sus' })
    expect(parseChord('G7sus4')).toMatchObject({ root: 'G', type: 'sus7' })
  })

  it('нормализует энгармонизмы', () => {
    expect(parseChord('C#maj7').root).toBe('Db')
    expect(parseChord('F#m7').root).toBe('Gb')
  })

  it('понимает слэш-аккорды', () => {
    const c = parseChord('C/E')
    expect(c).toMatchObject({ root: 'C', bass: 'E' })
  })

  it('возвращает null на мусоре', () => {
    expect(parseChord('')).toBeNull()
    expect(parseChord('H7')).toBeNull()
    expect(parseChord('Xyz')).toBeNull()
  })

  it('не распознаёт не-ASCII символы', () => {
    expect(parseChord('CΔ7')).toBeNull()
    expect(parseChord('Bø7')).toBeNull()
  })
})

describe('parseSequence', () => {
  it('разбирает строку через пробелы', () => {
    const { chords, errors } = parseSequence('Cmaj7 A7 Dm7 G7')
    expect(chords).toHaveLength(4)
    expect(errors).toHaveLength(0)
    expect(chords.map(c => c.name)).toEqual(['Cmaj7', 'A7', 'Dm7', 'G7'])
  })

  it('собирает ошибки по невалидным токенам', () => {
    const { chords, errors } = parseSequence('Cmaj7 Xyz G7')
    expect(chords).toHaveLength(2)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({ token: 'Xyz' })
  })
})