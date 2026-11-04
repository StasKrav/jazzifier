import { analyzeChord } from '../core/harmony.js'
import { makeEl, clear } from '../utils/dom.js'

function blockClass(info) {
  if (info.isDominant) return info.isSecondary ? 'fm-secdom' : 'fm-dom'
  if (info.deg === 1) return 'fm-tonic'
  if (info.deg === 4 || info.deg === 2) return 'fm-subdom'
  return 'fm-other'
}

function romanLabel(info) {
  if (info.isDominant && info.isSecondary) return 'V/' + (info.target || '?')
  if (info.isDominant) return 'V'
  if (info.deg) return ['I','II','III','IV','V','VI','VII'][info.deg - 1]
  return '?'
}

export function renderFunctionMap(root, state, dispatch) {
  clear(root)
  const { key, mode, nodes } = state
  if (!nodes.length) {
    root.style.display = 'none'
    return
  }
  root.style.display = 'block'

  const chords = nodes.map(n => n.chord)
  const track = makeEl('div', { class: 'fm-track' })

  nodes.forEach((node, i) => {
    const info = analyzeChord(node.chord, chords[i + 1], key, mode)
    const block = makeEl('div', {
      class: 'fm-block ' + blockClass(info),
      attrs: { 'data-id': node.id, title: info.func || '' },
    })
    block.appendChild(makeEl('span', { class: 'fm-name', text: node.chord.name }))
    block.appendChild(makeEl('span', { class: 'fm-roman', text: romanLabel(info) }))
    block.addEventListener('click', () => {
      // подсветить соответствующую карточку в анализе
      const card = document.querySelector(`.chord-row[data-id="${node.id}"]`)
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' })
        card.classList.add('pulse')
        setTimeout(() => card.classList.remove('pulse'), 900)
      }
    })
    track.appendChild(block)
  })

  root.appendChild(track)
}