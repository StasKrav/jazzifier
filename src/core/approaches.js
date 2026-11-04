import { transposeRoot } from './notes.js'

/**
 * Подходы к целевому аккорду.
 * context = { key, mode, next, prev, index, total }
 */
export function approachesFor(target, context = {}) {
  const result = []
  if (!target || !target.root) return result

  // Доминанта к цели — квинта вверх (7 полутонов).
  const vRoot = transposeRoot(target.root, 7)

  // Мажорные/минорные цели: тип аккорда однозначно определяет.
  const isMinorTarget =
    target.type === 'm' ||
    target.type === 'm7' ||
    target.type === 'mMaj7' ||
    target.type === 'm7b5'

  if (isMinorTarget) {
    // Minor ii–V: iiø (квинта вверх от V) → V7alt.
    const iiRoot = transposeRoot(vRoot, 7)
    const iiø = iiRoot + 'm7b5'
    const vAlt = vRoot + '7#9'
    result.push({
      id: `minor-iiV:${iiø}:${vAlt}`,
      label: `Minor ii–V к ${target.name}: ${iiø} → ${vAlt}`,
      tag: 'passing',
      kind: 'insertBefore',
      payload: { chords: [iiø, vAlt] },
      reason: `Minor ii–V (iiø–V7alt) перед ${target.name} — классический минорный подход.`,
      priority: 60,
    })
  } else {
    // Мажорный ii–V: ii m7 (квинта вверх от V) → V7.
    const iiRoot = transposeRoot(vRoot, 7)
    const ii = iiRoot + 'm7'
    const v = vRoot + '7'
    result.push({
      id: `iiV:${ii}:${v}`,
      label: `ii–V к ${target.name}: ${ii} → ${v}`,
      tag: 'passing',
      kind: 'insertBefore',
      payload: { chords: [ii, v] },
      reason: `ii–V перед ${target.name} — стандартная подготовка к цели.`,
      priority: 70,
    })
  }

  return result
}