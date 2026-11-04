import { analyzeChord, recommendationsFor } from '../core/harmony.js'
import { parseChord } from '../core/parser.js'
import { makeEl, clear, toolBtn } from '../utils/dom.js'

// --- временный UI-режим вставки (не в store) ---
// afterId — id блока, ПОСЛЕ которого открыто поле (или null, если закрыто)
// value — текущий ввод
let insert = { afterId: null, value: '' }

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
    // пустая последовательность: показываем только hint и, если открыт insert на «нулевом» блоке, — поле
    root.appendChild(makeEl('div', {
      class: 'hint',
      text: 'Введи последовательность аккордов и нажми «Анализировать» — например, Cmaj7 A7 Dm7 G7',
    }))
    return
  }

  const chords = nodes.map(n => n.chord)

  // Сброс insert, если привязанный блок исчез
  if (insert.afterId != null && !nodes.some(n => n.id === insert.afterId)) {
    insert = { afterId: null, value: '' }
  }

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
    block.addEventListener('click', () => dispatch({ type: 'select', id: node.id }))
    track.appendChild(block)

    // inline-поле ПОСЛЕ этого блока, если открыто
    if (insert.afterId === node.id) {
      track.appendChild(makeInsertSlot(node.id, i, dispatch, root, state))
    }
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

  const head = makeEl('div', { class: 'tl-panel-head' })
  head.appendChild(makeEl('span', { class: 'tl-panel-title', text: selected.chord.name }))
  head.appendChild(makeEl('span', { class: 'tl-panel-func', text: info.func || '' }))
  panel.appendChild(head)

  const tools = makeEl('div', { class: 'tl-panel-tools' })
  tools.appendChild(toolBtn('× удалить', 'Удалить', () =>
    dispatch({ type: 'remove', index: selectedIndex })))
  if (selectedIndex > 0) tools.appendChild(toolBtn('↑ влево', 'Сдвинуть влево', () =>
    dispatch({ type: 'move', from: selectedIndex, to: selectedIndex - 1 })))
  if (selectedIndex < nodes.length - 1) tools.appendChild(toolBtn('↓ вправо', 'Сдвинуть вправо', () =>
    dispatch({ type: 'move', from: selectedIndex, to: selectedIndex + 1 })))
  tools.appendChild(toolBtn('+ после', 'Вставить аккорд после', () => {
    insert = { afterId: selected.id, value: '' }
    renderTimeline(root, state, dispatch)
  }))
  panel.appendChild(tools)

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
      b.addEventListener('click', () => dispatch({ type: 'applyRec', index: selectedIndex, rec }))
      list.appendChild(b)
    })
  }
  panel.appendChild(list)

  root.appendChild(panel)
}

// --- inline-слот вставки ---
function makeInsertSlot(afterId, afterIndex, dispatch, root, state) {
  const slot = makeEl('div', { class: 'tl-insert-slot' })

  const inp = makeEl('input', {
    class: 'tl-insert-input',
    attrs: {
      type: 'text',
      placeholder: 'G7',
      value: insert.value,
      'aria-label': 'Новый аккорд',
    },
  })

  const ok = makeEl('button', { class: 'tl-insert-ok', text: '↵' })
  ok.disabled = !parseChord(insert.value)

  const cancel = makeEl('button', { class: 'tl-insert-cancel', text: '×' })

  function close() {
    insert = { afterId: null, value: '' }
    renderTimeline(root, state, dispatch)
  }

  function commit() {
    const val = insert.value.trim()
    const parsed = parseChord(val)
    if (!parsed) return
    dispatch({ type: 'insert', index: afterIndex + 1, chord: val })
    // остаёмся в режиме вставки, но после нового блока
    // новый блок станет выбранным (dispatch 'insert' это делает),
    // а его id мы узнаем после рендера — проще: закрыть и открыть заново
    // на следующем тике, привязавшись к новому выбранному
    queueMicrotask(() => {
      const st = state // state тут «старый», поэтому лучше полагаться на store в main
    })
    // Вместо этого: закрываем и открываем после обновления store.
    // Проще всего — оставить insert.value пустым и перепривязать по selectedId.
    insert = { afterId: null, value: '' }
  }

  inp.addEventListener('input', e => {
    insert.value = e.target.value
    const parsed = parseChord(e.target.value)
    inp.classList.toggle('is-invalid', !!e.target.value && !parsed)
    ok.disabled = !parsed
  })

  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  })

  ok.addEventListener('click', commit)
  cancel.addEventListener('click', close)

  slot.appendChild(inp)
  slot.appendChild(ok)
  slot.appendChild(cancel)

  // фокус после рендера
  queueMicrotask(() => {
    inp.focus()
    const len = inp.value.length
    inp.setSelectionRange(len, len)
  })

  return slot
}