const ALL_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export function initControls(dispatch, store) {
  const input = document.getElementById('input')
  const rootSel = document.getElementById('key-root')
  const modeBtns = document.querySelectorAll('.mode-toggle button')
  const runBtn = document.getElementById('run-btn')
  const undoBtn = document.getElementById('undo-btn')
  const redoBtn = document.getElementById('redo-btn')

  // --- тоники ---
  if (rootSel && rootSel.options.length === 0) {
    ALL_KEYS.forEach(root => {
      rootSel.appendChild(new Option(root, root))
    })
  }

  // --- синхронизация с store ---
  const s = store.get()
  if (input) input.value = s.inputText
  if (rootSel) rootSel.value = s.key
  setActiveMode(s.mode)
  syncUndoRedo()

  // --- run ---
  const doRun = () => {
    dispatch({
      type: 'run',
      text: input?.value || '',
      key: rootSel?.value || 'C',
      mode: getActiveMode(),
    })
  }
  runBtn?.addEventListener('click', doRun)
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doRun()
  })

  // --- переключатель лада ---
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveMode(btn.dataset.mode)
      // применяем сразу, без ожидания «Анализировать»
      dispatch({
        type: 'run',
        text: input?.value || '',
        key: rootSel?.value || 'C',
        mode: btn.dataset.mode,
      })
    })
  })

  const applyRecBtn = document.getElementById('apply-rec-btn')
  applyRecBtn?.addEventListener('click', () => dispatch({ type: 'applyRecommended' }))

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

  function getActiveMode() {
    const active = document.querySelector('.mode-toggle button.active')
    return active?.dataset.mode || 'major'
  }
  function setActiveMode(mode) {
    modeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode)
    })
  }
  function syncUndoRedo() {
    if (undoBtn) undoBtn.disabled = !store.canUndo()
    if (redoBtn) redoBtn.disabled = !store.canRedo()
  }
  store.subscribe(syncUndoRedo)
}