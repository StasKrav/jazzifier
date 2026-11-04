import { parseChord } from '../core/parser.js'
import { analyzeChord, seventhByFunction } from '../core/harmony.js'

export function makeNode(state, chord, original = null) {
  return { id: state.nextId, chord, original, _nextId: state.nextId + 1 }
}

export function addNode(state, index, chordStr) {
  const chord = parseChord(chordStr)
  if (!chord) return state
  const nodes = [...state.nodes]
  nodes.splice(index, 0, { id: state.nextId, chord, original: null })
  return { ...state, nodes, nextId: state.nextId + 1 }
}

export function removeNode(state, index) {
  if (index < 0 || index >= state.nodes.length) return state
  return { ...state, nodes: state.nodes.filter((_, i) => i !== index) }
}

export function moveNode(state, from, to) {
  if (from === to) return state
  const nodes = [...state.nodes]
  const [node] = nodes.splice(from, 1)
  nodes.splice(to, 0, node)
  return { ...state, nodes }
}

export function replaceNode(state, index, chordStr) {
  const chord = parseChord(chordStr)
  if (!chord) return state
  const nodes = state.nodes.map((n, i) => i === index ? { ...n, chord } : n)
  return { ...state, nodes }
}

export function applyRecommendation(state, index, rec) {
  switch (rec.kind) {
    case 'replace':
      return replaceNode(state, index, rec.payload.chord)
    case 'insertBefore':
      if (rec.payload.chords) return insertMany(state, index, rec.payload.chords)
      return addNode(state, index, rec.payload.chord)
    case 'insertAfter':
      if (rec.payload.chords) return insertMany(state, index + 1, rec.payload.chords)
      return addNode(state, index + 1, rec.payload.chord)
    default:
      return state
  }
}

function insertMany(state, index, chordNames) {
  let s = state
  chordNames.forEach((name, offset) => {
    s = addNode(s, index + offset, name)
  })
  return s
}

export function resetToOriginal(state) {
  const nodes = state.nodes.map(n =>
    n.original ? { ...n, chord: parseChord(n.original) } : n
  )
  return { ...state, nodes }
}

export function applyRecommended(state) {
  const { key, mode, nodes } = state
  const chords = nodes.map(n => n.chord)

  const newNodes = nodes.map((node, i) => {
    const info = analyzeChord(node.chord, chords[i + 1], key, mode)
    if (info.isDominant) return node
    if (node.chord.type === 'maj' || node.chord.type === 'm') {
      const sept = seventhByFunction(node.chord, info.deg, mode)
      if (sept) {
        const parsed = parseChord(sept)
        if (parsed) return { ...node, chord: parsed }
      }
    }
    return node
  })

  return { ...state, nodes: newNodes }
}