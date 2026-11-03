import { makeEl, clear } from '../utils/dom.js'

export function renderResult(root, state, dispatch) {
  root.style.display = state.nodes.length ? 'block' : 'none'
  clear(root)

  root.appendChild(makeEl('h2', { text: '02 — Новая гармоническая линия' }))

  const seqEl = makeEl('div', { class: 'result-seq' })
  state.nodes.forEach((node, i) => {
    const changed = node.original && node.chord.name !== node.original
    seqEl.appendChild(makeEl('span', {
      class: changed ? 'changed' : '',
      text: node.chord.name,
    }))
    if (i < state.nodes.length - 1) {
      seqEl.appendChild(makeEl('span', { class: 'arrow', text: '→' }))
    }
  })
  root.appendChild(seqEl)

  const note = makeEl('div', { class: 'note' })
  note.textContent =
    'Золотым отмечены изменённые аккорды. Кнопка «Сбросить к оригиналу» вернёт исходную последовательность.'
  root.appendChild(note)

  const actions = makeEl('div', { class: 'result-actions' })
  const resetBtn = makeEl('button', { text: '↺ Сбросить к оригиналу' })
  resetBtn.addEventListener('click', () => dispatch({ type: 'resetToOriginal' }))
  actions.appendChild(resetBtn)
  root.appendChild(actions)
}