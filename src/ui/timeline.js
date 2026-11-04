import { analyzeChord, recommendationsFor } from '../core/harmony.js'
import { makeEl, clear, toolBtn } from '../utils/dom.js'

function blockClass(info) {
  if (info.isDominant) return info.isSecondary ? 'tl-secdom' : 'tl-dom'
  if (info.deg === 1) return 'tl-tonic'
  if (info.deg === 4 || info.deg === 2) return 'tl-subdom'
  return 'tl-other'
}

function romanLabel(info) {
  if (info.isDominant && info.isSecondary) return 'V/' + (info.target || '?')
  if (info.isDominant) return 'V'
  if (info.deg) return ['I','II','III','IV','V','VI','VII'][info.deg - 1]
  return '?'
}

export function renderTimeline(root, state, dispatch) {
  clear(root)
  const { key, mode, nodes, selectedId } = state

  if (!nodes.length) {
    root.appendChild(makeEl('div', {
      class: 'hint',
      text: 'Введи последовательность аккордов и нажми «Анализировать» — например, Cmaj7 A7 Dm7 G7',
    }))
    return
  }

  const chords = nodes.map(n => n.chord)

  // ---- лента ----
  const track = makeEl('div', { class: 'tl-track' })
  nodes.forEach((node, i) => {
    const info = analyzeChord(node.chord, chords[i + 1], key, mode)
    const block = makeEl('div', {
      class: 'tl-block ' + blockClass(info) + (node.id === selectedId ? ' is-selected' : ''),
      attrs: { 'data-id': node.id, title: info.func || '' },
    })
    block.appendChild(makeEl('span', { class: 'tl-name', text: node.chord.name }))
    block.appendChild(makeEl('span', { class: 'tl-roman', text: romanLabel(info) }))
    block.addEventListener('click', () =>
      dispatch({ type: 'select', id: node.id }))
    track.appendChild(block)
  })
  root.appendChild(track)

  // ---- панель рекомендаций выбранного блока ----
  const selectedIndex = nodes.findIndex(n => n.id === selectedId)
  const selected = selectedIndex !== -1 ? nodes[selectedIndex] : null

  const panel = makeEl('div', { class: 'tl-panel' })

  if (!selected) {
    panel.appendChild(makeEl('div', { class: 'hint', text: 'Выбери аккорд в ленте' }))
    root.appendChild(panel)
    return
  }

  const info = analyzeChord(selected.chord, chords[selectedIndex + 1], key, mode)

  // заголовок
  const head = makeEl('div', { class: 'tl-panel-head' })
  head.appendChild(makeEl('span', { class: 'tl-panel-title', text: selected.chord.name }))
  head.appendChild(makeEl('span', {
    class: 'tl-panel-func',
    text: info.func || '',
  }))
  panel.appendChild(head)

  // кнопки редактирования
  const tools = makeEl('div', { class: 'tl-panel-tools' })
  tools.appendChild(toolBtn('× удалить', 'Удалить', () =>
    dispatch({ type: 'remove', index: selectedIndex })))
  if (selectedIndex > 0) tools.appendChild(toolBtn('↑ влево', 'Сдвинуть влево', () =>
    dispatch({ type: 'move', from: selectedIndex, to: selectedIndex - 1 })))
  if (selectedIndex < nodes.length - 1) tools.appendChild(toolBtn('↓ вправо', 'Сдвинуть вправо', () =>
    dispatch({ type: 'move', from: selectedIndex, to: selectedIndex + 1 })))
  tools.appendChild(toolBtn('+ после', 'Добавить аккорд после', () => {
    const val = prompt('Аккорд:', 'G7')
    if (val) dispatch({ type: 'insert', index: selectedIndex + 1, chord: val })
  }))
  panel.appendChild(tools)

  // рекомендации
  const recs = recommendationsFor(selected.chord, chords[selectedIndex + 1], info, key, mode)
  const list = makeEl('div', { class: 'tl-recs' })

  if (!recs.length) {
    list.appendChild(makeEl('span', { class: 'hint', text: 'Нет вариантов для этого аккорда' }))
  } else {
    recs.forEach(rec => {
      const b = makeEl('button', {
        class: 'tl-rec',
        html: `${rec.label} <span class="tag ${rec.tag}">${rec.tag}</span>`,
        attrs: { type: 'button', title: rec.reason || '' },
      })
      b.addEventListener('click', () =>
        dispatch({ type: 'applyRec', index: selectedIndex, rec }))
      list.appendChild(b)
    })
  }
  panel.appendChild(list)

  root.appendChild(panel)
}