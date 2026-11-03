import { analyzeChord, recommendationsFor } from '../core/harmony.js'
import { makeEl, clear, toolBtn } from '../utils/dom.js'

function rowClass(info) {
  if (info.isDominant) return info.isSecondary ? 'secdom' : 'dom'
  if (info.deg === 1) return 'tonic'
  if (info.deg === 4 || info.deg === 2) return 'subdom'
  return 'other'
}

function funcClass(info) {
  if (info.isDominant) return info.isSecondary ? 'secdom' : 'dom'
  if (info.warn) return 'warn'
  return ''
}

export function renderAnalysis(root, state, dispatch) {
  clear(root)
  const { key, mode, nodes } = state
  if (!nodes.length) {
    root.appendChild(makeEl('div', {
      class: 'error',
      text: 'Не удалось распознать аккорды. Проверь обозначения и разделяй аккорды пробелами.',
    }))
    return
  }

  const chords = nodes.map(n => n.chord)

  nodes.forEach((node, i) => {
    const info = analyzeChord(node.chord, chords[i + 1], key, mode)
    const recs = recommendationsFor(node.chord, chords[i + 1], info, key, mode)

    const row = makeEl('div', {
      class: 'chord-row ' + rowClass(info),
      attrs: { 'data-id': node.id },
    })

    row.appendChild(makeEl('span', { class: 'chord-name', text: node.chord.name }))
    row.appendChild(makeEl('span', {
      class: 'func ' + funcClass(info),
      text: info.func || '',
    }))

    // кнопки редактирования
    const tools = makeEl('div', { class: 'node-tools' })
    tools.appendChild(toolBtn('×', 'Удалить', () =>
      dispatch({ type: 'remove', index: i })))
    if (i > 0) tools.appendChild(toolBtn('↑', 'Влево', () =>
      dispatch({ type: 'move', from: i, to: i - 1 })))
    if (i < nodes.length - 1) tools.appendChild(toolBtn('↓', 'Вправо', () =>
      dispatch({ type: 'move', from: i, to: i + 1 })))
    tools.appendChild(toolBtn('+', 'Добавить после', () => {
      const val = prompt('Аккорд:', 'G7')
      if (val) dispatch({ type: 'insert', index: i + 1, chord: val })
    }))
    row.appendChild(tools)

    // рекомендации
    const sugg = makeEl('div', { class: 'sugg' })
    if (!recs.length) {
      sugg.appendChild(makeEl('span', { class: 'empty', text: 'нет вариантов' }))
    } else {
      recs.forEach(rec => {
        const b = makeEl('button', {
          html: `${rec.label} <span class="tag ${rec.tag}">${rec.tag}</span>`,
          attrs: { type: 'button', title: rec.reason || '' },
        })
        b.addEventListener('click', () =>
          dispatch({ type: 'applyRec', index: i, rec }))
        sugg.appendChild(b)
      })
    }
    row.appendChild(sugg)
    root.appendChild(row)
  })
}