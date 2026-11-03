import './style.css'
import { createStore } from './state/store.js'
import * as seq from './state/sequence.js'
import { parseSequence } from './core/parser.js'
import { renderAnalysis } from './ui/analysis.js'
import { renderResult } from './ui/result.js'
import { initControls } from './ui/controls.js'

const DEFAULT_INPUT = 'C C7 F C C7 F C C7 G C C7 G C'

function initialState(text = DEFAULT_INPUT, key = 'C', mode = 'major') {
  const { chords } = parseSequence(text)
  return {
    key,
    mode,
    nodes: chords.map((c, i) => ({ id: i + 1, chord: c, original: c.original })),
    nextId: chords.length + 1,
    inputText: text,
  }
}

const store = createStore(initialState())

// dispatch
function dispatch(action) {
  const s = store.get()
  let next = s
  switch (action.type) {
    case 'run': {
      const { chords, errors } = parseSequence(action.text)
      next = {
        ...s,
        key: action.key,
        mode: action.mode,
        inputText: action.text,
        nodes: chords.map((c, i) => ({ id: s.nextId + i, chord: c, original: c.original })),
        nextId: s.nextId + chords.length,
      }
      break
    }
    case 'remove':
      next = seq.removeNode(s, action.index)
      break
    case 'insert':
      next = seq.addNode(s, action.index, action.chord)
      break
    case 'move':
      next = seq.moveNode(s, action.from, action.to)
      break
    case 'applyRec':
      next = seq.applyRecommendation(s, action.index, action.rec)
      break
    case 'resetToOriginal':
      next = seq.resetToOriginal(s)
      break
    case 'applyRecommended':
      next = seq.applyRecommended(s)
      break
    case 'undo':
      store.undo()
      return
    case 'redo':
      store.redo()
      return
  }
  if (next !== s) store.commit(next)
}

const analysisEl = document.getElementById('analysis')
const resultEl = document.getElementById('result')
store.subscribe(s => renderAnalysis(analysisEl, s, dispatch))
store.subscribe(s => renderResult(resultEl, s, dispatch))

initControls(dispatch, store)