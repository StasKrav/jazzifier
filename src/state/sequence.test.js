import { describe, it, expect } from 'vitest'
import {
  addNode, removeNode, moveNode, replaceNode,
  applyRecommendation, resetToOriginal, applyRecommended,
} from './sequence.js'
import { parseChord } from '../core/parser.js'

function makeState(names) {
  return {
    key: 'C',
    mode: 'major',
    nodes: names.map((n, i) => ({ id: i + 1, chord: parseChord(n), original: n })),
    nextId: names.length + 1,
    inputText: names.join(' '),
  }
}

describe('addNode', () => {
  it('вставляет в середину, не мутируя исходное состояние', () => {
    const s = makeState(['C', 'G'])
    const next = addNode(s, 1, 'Dm7')
    expect(next.nodes.map(n => n.chord.name)).toEqual(['C', 'Dm7', 'G'])
    expect(s.nodes.map(n => n.chord.name)).toEqual(['C', 'G']) // исходное не тронуто
  })

  it('не меняет состояние при невалидном аккорде', () => {
    const s = makeState(['C'])
    expect(addNode(s, 0, 'Xyz')).toBe(s)
  })
})

describe('removeNode', () => {
  it('удаляет по индексу', () => {
    const s = makeState(['C', 'Dm7', 'G7'])
    const next = removeNode(s, 1)
    expect(next.nodes.map(n => n.chord.name)).toEqual(['C', 'G7'])
  })

  it('игнорирует некорректный индекс', () => {
    const s = makeState(['C'])
    expect(removeNode(s, 5)).toBe(s)
    expect(removeNode(s, -1)).toBe(s)
  })
})

describe('moveNode', () => {
  it('переставляет вправо', () => {
    const s = makeState(['C', 'Dm7', 'G7'])
    const next = moveNode(s, 0, 2)
    expect(next.nodes.map(n => n.chord.name)).toEqual(['Dm7', 'G7', 'C'])
  })

  it('переставляет влево', () => {
    const s = makeState(['C', 'Dm7', 'G7'])
    const next = moveNode(s, 2, 0)
    expect(next.nodes.map(n => n.chord.name)).toEqual(['G7', 'C', 'Dm7'])
  })

  it('возвращает то же состояние при from === to', () => {
    const s = makeState(['C', 'Dm7'])
    expect(moveNode(s, 1, 1)).toBe(s)
  })
})

describe('replaceNode', () => {
  it('заменяет аккорд, сохраняя id', () => {
    const s = makeState(['C', 'G7'])
    const next = replaceNode(s, 0, 'Cmaj7')
    expect(next.nodes[0].chord.name).toBe('Cmaj7')
    expect(next.nodes[0].id).toBe(s.nodes[0].id)
  })
})

describe('applyRecommendation', () => {
  it('replace', () => {
    const s = makeState(['C', 'G7'])
    const next = applyRecommendation(s, 0, {
      kind: 'replace', payload: { chord: 'Cmaj7' },
    })
    expect(next.nodes.map(n => n.chord.name)).toEqual(['Cmaj7', 'G7'])
  })

  it('insertBefore', () => {
    const s = makeState(['G7'])
    const next = applyRecommendation(s, 0, {
      kind: 'insertBefore', payload: { chord: 'Dm7' },
    })
    expect(next.nodes.map(n => n.chord.name)).toEqual(['Dm7', 'G7'])
  })

  it('insertAfter', () => {
    const s = makeState(['Dm7'])
    const next = applyRecommendation(s, 0, {
      kind: 'insertAfter', payload: { chord: 'G7' },
    })
    expect(next.nodes.map(n => n.chord.name)).toEqual(['Dm7', 'G7'])
  })
})

describe('resetToOriginal', () => {
  it('возвращает исходные аккорды по original', () => {
    const s = makeState(['C', 'G7'])
    const modified = replaceNode(s, 0, 'Cmaj7')
    const reset = resetToOriginal(modified)
    expect(reset.nodes.map(n => n.chord.name)).toEqual(['C', 'G7'])
  })
})