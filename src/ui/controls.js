const ALL_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export function initControls(dispatch, store) {
  const input = document.getElementById('input')
  const keySel = document.getElementById('key')
  const runBtn = document.getElementById('run-btn')
  const undoBtn = document.getElementById('undo-btn')
  const redoBtn = document.getElementById('redo-btn')

  // --- ключи ---
  if (keySel && keySel.options.length === 0) {
    ALL_KEYS.forEach(root => {
      keySel.appendChild(new Option(root + ' мажор', root + ':major'))
      keySel.appendChild(new Option(root + ' минор', root + ':minor'))
    })
  }

  // --- начальная синхронизация из store ---
  const s = store.get()
  if (input) input.value = s.inputText
  if (keySel) keySel.value = `${s.key}:${s.mode}`
  syncUndoRedo()

  // --- run ---
  const doRun = () => {
    const [key, mode] = (keySel?.value || 'C:major').split(':')
    dispatch({ type: 'run', text: input?.value || '', key, mode })
  }
  runBtn?.addEventListener('click', doRun)
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doRun()
  })

  const applyBtn = document.getElementById('apply-rec-btn')
  applyBtn?.addEventListener('click', () => dispatch({ type: 'applyRecommended' }))

  // --- undo / redo ---
  undoBtn?.addEventListener('click', () => dispatch({ type: 'undo' }))
  redoBtn?.addEventListener('click', () => dispatch({ type: 'redo' }))

  // --- горячие клавиши ---
  document.addEventListener('keydown', e => {
    const meta = e.ctrlKey || e.metaKey
    if (!meta) return
    if (e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      dispatch({ type: 'undo' })
    } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
      e.preventDefault()
      dispatch({ type: 'redo' })
    }
  })

  // --- включение/выключение кнопок ---
  function syncUndoRedo() {
    if (undoBtn) undoBtn.disabled = !store.canUndo()
    if (redoBtn) redoBtn.disabled = !store.canRedo()
  }
  store.subscribe(syncUndoRedo)
}