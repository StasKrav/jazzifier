import './style.css'
import { createStore } from './state/store.js'
import * as seq from './state/sequence.js'
import { parseSequence } from './core/parser.js'
import { renderTimeline } from './ui/timeline.js'
import { renderResult } from './ui/result.js'
import { initControls } from './ui/controls.js'

// ---------- начальное состояние ----------
function emptyState(key = 'C', mode = 'major') {
  return {
    key,
    mode,
    nodes: [],
    nextId: 1,
    inputText: '',
    selectedId: null,
  }
}

const store = createStore(emptyState())

// ---------- выбор валидного узла ----------
function ensureSelection(state) {
  if (!state.nodes.length) {
    if (state.selectedId == null) return state
    return { ...state, selectedId: null }
  }
  const exists = state.nodes.some(n => n.id === state.selectedId)
  if (exists) return state
  return { ...state, selectedId: state.nodes[0].id }
}

// ---------- dispatch ----------
function dispatch(action) {
  const s = store.get()
  let next = s

  switch (action.type) {
    case 'run': {
      const { chords } = parseSequence(action.text)
      next = {
        ...s,
        key: action.key,
        mode: action.mode,
        inputText: action.text,
        nodes: chords.map((c, i) => ({
          id: s.nextId + i,
          chord: c,
          original: c.original,
        })),
        nextId: s.nextId + chords.length,
        selectedId: chords.length ? s.nextId : null,
      }
      break
    }

    case 'select':
      next = { ...s, selectedId: action.id }
      break

    case 'remove':
      next = seq.removeNode(s, action.index)
      break

    case 'insert':
      next = seq.addNode(s, action.index, action.chord)
      // выбрать только что вставленный узел
      if (next !== s && next.nodes[action.index]) {
        next = { ...next, selectedId: next.nodes[action.index].id }
      }
      break

    case 'move':
      next = seq.moveNode(s, action.from, action.to)
      break

    case 'applyRec':
      next = seq.applyRecommendation(s, action.index, action.rec)
      break

    case 'applyRecommended':
      next = seq.applyRecommended(s)
      break

    case 'resetToOriginal':
      next = seq.resetToOriginal(s)
      break

    case 'undo':
      store.undo()
      return

    case 'redo':
      store.redo()
      return

    default:
      console.warn('[dispatch] unknown action:', action)
      return
  }

  next = ensureSelection(next)
  if (next !== s) store.commit(next)
}

// ---------- рендер ----------
const tlEl = document.getElementById('timeline')
const resultEl = document.getElementById('result')

if (tlEl) store.subscribe(s => renderTimeline(tlEl, s, dispatch))
if (resultEl) store.subscribe(s => renderResult(resultEl, s, dispatch))

// ---------- контролы ----------
initControls(dispatch, store)