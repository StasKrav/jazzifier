// ================= STORE =================
// Централизованное состояние + история изменений (undo/redo) + подписки.
// Не знает ни про DOM, ни про гармонию — только про данные.

export function createStore(initial) {
  let present = initial
  const past = []
  const future = []
  const subs = new Set()
  const HISTORY_LIMIT = 100

  const snapshot = (state) => state // состояние иммутабельно, ссылки достаточно

  function emit() {
    for (const fn of subs) {
      try {
        fn(present)
      } catch (err) {
        // одна упавшая подписка не должна ломать остальные
        console.error('[store] subscriber error:', err)
      }
    }
  }

  return {
    // --- чтение ---
    get: () => present,

    // --- подписка ---
    // fn вызывается сразу при подписке и при каждом изменении.
    // Возвращает функцию отписки.
    subscribe(fn) {
      if (typeof fn !== 'function') return () => {}
      subs.add(fn)
      fn(present)
      return () => subs.delete(fn)
    },

    // --- изменение с записью в историю ---
    // Игнорирует "пустые" изменения (та же ссылка), чтобы undo не засорялся.
    commit(next) {
      if (next === present) return
      past.push(snapshot(present))
      if (past.length > HISTORY_LIMIT) past.shift()
      present = next
      future.length = 0
      emit()
    },

    // --- изменение без записи в историю ---
    // Для технических обновлений (например, синхронизация inputText с UI).
    set(next) {
      if (next === present) return
      present = next
      emit()
    },

    // --- undo / redo ---
    undo() {
      if (!past.length) return
      future.push(snapshot(present))
      present = past.pop()
      emit()
    },

    redo() {
      if (!future.length) return
      past.push(snapshot(present))
      present = future.pop()
      emit()
    },

    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,

    // --- полный сброс (новая сессия) ---
    reset(next) {
      past.length = 0
      future.length = 0
      present = next
      emit()
    },
  }
}