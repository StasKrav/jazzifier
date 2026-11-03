import { NOTES, SEMI } from './notes.js'
import { degreeInScale, ROMAN } from './scales.js'

// ================= БАЗОВЫЕ ФУНКЦИИ =================

export function transposeRoot(root, semitones) {
  return NOTES[(SEMI[root] + semitones + 12) % 12]
}

export function dominantFor(targetRoot) {
  return transposeRoot(targetRoot, 5) + '7'
}

export function tritoneSub(targetRoot) {
  return NOTES[(SEMI[targetRoot] + 1) % 12] + '7'
}

export function dimExact(domRoot) {
  return NOTES[(SEMI[domRoot] + 6) % 12] + 'dim7'
}

export function dimAlt(domRoot) {
  return domRoot + 'dim7'
}

export function isDominantTo(chord, nextChord) {
  if (chord.type !== '7' || !nextChord) return false
  const iv = (SEMI[nextChord.root] - SEMI[chord.root] + 12) % 12
  return iv === 5 || iv === 11
}

// ================= АНАЛИЗ =================

export function analyzeChord(chord, nextChord, keyRoot, mode) {
  const deg = degreeInScale(chord.root, keyRoot, mode)
  const info = {
    deg,
    func: null,
    isDominant: false,
    isSecondary: false,
    target: null,
    warn: false,
  }

  if (isDominantTo(chord, nextChord)) {
    const targetDeg = degreeInScale(nextChord.root, keyRoot, mode)
    info.target = nextChord.root
    info.isDominant = true

    const isTritoneSub = (SEMI[nextChord.root] - SEMI[chord.root] + 12) % 12 === 11
    if (isTritoneSub) {
      info.func = `Тритоновая замена доминанты к ${nextChord.root}`
      info.isTritoneAlready = true
      return info
    }

    if (targetDeg === 1) {
      info.func = `V7 — доминанта к ${nextChord.root}`
    } else {
      info.isSecondary = true
      const roman = targetDeg ? ROMAN[targetDeg - 1] : '?'
      info.func = `V7/${roman} — вторичная доминанта к ${nextChord.root}`
    }
    return info
  }

  if (chord.type === '7') {
    const roman = deg ? ROMAN[deg - 1] : '?'
    info.func = `${roman}7 — блюзовая краска, не доминанта`
    info.warn = true
    return info
  }

  // Проверка «заимствованного» качества
  const expectedQuality =
    mode === 'major'
      ? { 1: 'maj', 2: 'm', 3: 'm', 4: 'maj', 5: 'maj', 6: 'm', 7: 'dim' }[deg]
      : { 1: 'm', 2: 'dim', 3: 'maj', 4: 'm', 5: 'maj', 6: 'maj', 7: 'dim' }[deg]

  if (
    deg &&
    expectedQuality &&
    chord.type !== expectedQuality &&
    !(chord.type === 'maj7' && expectedQuality === 'maj') &&
    !(chord.type === 'm7' && expectedQuality === 'm') &&
    !(chord.type === '7' && deg === 5)
  ) {
    info.borrowed = true
  }

  if (mode === 'major') {
    if (deg === 1) info.func = 'I — тоника'
    else if (deg === 4) info.func = 'IV — субдоминанта'
    else if (deg === 2) info.func = 'ii — субдоминанта'
    else if (deg === 6) info.func = 'vi — тоника минорная'
    else if (deg === 3) info.func = 'iii — медианта'
    else if (deg === 5) info.func = 'V — доминанта (трезвучие)'
    else if (deg === 7) info.func = 'vii° — вводный'
    else { info.func = 'вне тональности'; info.warn = true }
  } else {
    if (deg === 1) info.func = 'i — тоника'
    else if (deg === 4) info.func = 'iv — субдоминанта'
    else if (deg === 2) info.func = 'ii° — субдоминанта'
    else if (deg === 3) info.func = 'III — параллель мажор'
    else if (deg === 5) info.func = 'V — доминанта (трезвучие, гарм. минор)'
    else if (deg === 6) info.func = 'VI — медианта'
    else if (deg === 7) info.func = 'VII — вводный/медианта'
    else { info.func = 'вне тональности'; info.warn = true }
  }

  if (info.borrowed) info.func += ' · заимствованное качество'
  return info
}

export function seventhByFunction(chord, deg, mode) {
  if (mode === 'major') {
    if (deg === 1 || deg === 4) return chord.root + 'maj7'
    if (deg === 2 || deg === 3 || deg === 6) return chord.root + 'm7'
    if (deg === 5) return chord.root + '7'
  } else {
    if (deg === 1) return chord.root + 'm7'
    if (deg === 2) return chord.root + 'm7b5'
    if (deg === 3 || deg === 6) return chord.root + 'maj7'
    if (deg === 4) return chord.root + 'm7'
    if (deg === 5) return chord.root + '7'
    if (deg === 7) return chord.root + 'dim7'
  }
  return null
}

// ================= РЕКОМЕНДАЦИИ =================

export function recommendationsFor(chord, next, info, keyRoot, mode) {
  const recs = []
  const push = (rec) => {
    if (rec && rec.payload && rec.payload.chord) recs.push(rec)
  }

  // Септаккорд по функции
  if ((chord.type === 'maj' || chord.type === 'm') && info.deg && !info.isDominant) {
    const sept = seventhByFunction(chord, info.deg, mode)
    if (sept && sept !== chord.name) {
      push({
        id: `seventh:${sept}`,
        label: `Септаккорд: ${sept}`,
        tag: 'seventh',
        kind: 'replace',
        payload: { chord: sept },
        reason: 'Диатоническое расширение сохраняет функцию и добавляет джазовую окраску.',
      })
    }
  }

  // Тритоновая и проходящие
  if (info.isDominant && !info.isTritoneAlready && info.target) {
    const sub = tritoneSub(info.target)
    const iiRoot = NOTES[(SEMI[info.target] + 10) % 12]
    const iiChord = iiRoot + 'm7'

    push({
      id: `prep-ii:${iiChord}`,
      label: `Подготовка ii–V: ${iiChord} → ${chord.name}`,
      tag: 'passing',
      kind: 'insertBefore',
      payload: { chord: iiChord },
      reason: `ii–V перед ${chord.name} усиливает направленность к цели ${info.target}.`,
    })

    if (chord.type === '7' && !chord.extension) {
      push({
        id: `ext:${chord.root}9`,
        label: `Расширение: ${chord.root}9`,
        tag: 'seventh',
        kind: 'replace',
        payload: { chord: chord.root + '9' },
        reason: 'Добавление 9-й ступени — безопасное расширение доминанты.',
      })
    }

    push({
      id: `tritone:${sub}`,
      label: `Тритоновая: ${sub}`,
      tag: 'tritone',
      kind: 'replace',
      payload: { chord: sub },
      reason: 'Тритоновая замена сохраняет ведущие тона доминанты, меняя бас и окраску.',
    })
  }

  // Уменьшённые
  if (info.isDominant) {
    const dExact = dimExact(chord.root)
    const dAlt = dimAlt(chord.root)
    push({
      id: `dim:${dExact}`,
      label: `Уменьшённый: ${dExact} → ${chord.name}`,
      tag: 'dim',
      kind: 'insertBefore',
      payload: { chord: dExact },
      reason: 'Уменьшённый аккорд на полтона выше — хроматический подход к доминанте.',
    })
    if (dAlt !== dExact) {
      push({
        id: `dimalt:${dAlt}`,
        label: `Уменьшённый (альт.): ${dAlt} → ${chord.name}`,
        tag: 'dimalt',
        kind: 'insertBefore',
        payload: { chord: dAlt },
        reason: 'Уменьшённый от корня — альтернативный подход к доминанте.',
      })
    }
  }

  // Подход к следующему аккорду
  if (next && !info.isDominant && (info.deg === 2 || info.deg === 4 || info.deg === 6 || info.warn)) {
    const approach = dominantFor(next.root)
    push({
      id: `approach:${approach}`,
      label: `Подвести к ${next.root}: ${approach}`,
      tag: 'passing',
      kind: 'insertAfter',
      payload: { chord: approach },
      reason: `V7/${next.root} создаёт направленное напряжение к следующему аккорду.`,
    })
  }

  // Modal interchange: IV → iv
  if (mode === 'major' && info.deg === 4 && !info.isDominant) {
    const iv = chord.root + 'm7'
    push({
      id: `parallel-iv:${iv}`,
      label: `Из параллельного минора: ${iv}`,
      tag: 'parallel',
      kind: 'replace',
      payload: { chord: iv },
      reason: 'iv из параллельного минора добавляет мягкую минорную субдоминантовую окраску.',
    })
  }

  // Параллель тоники
  if (info.deg === 1 && !info.isDominant) {
    const parallel = mode === 'major'
      ? NOTES[(SEMI[chord.root] + 9) % 12] + 'm7'
      : NOTES[(SEMI[chord.root] + 3) % 12] + 'maj7'
    push({
      id: `parallel:${parallel}`,
      label: `Параллель: ${parallel}`,
      tag: 'parallel',
      kind: 'replace',
      payload: { chord: parallel },
      reason: 'Параллельная тоника сохраняет устойчивость, меняя эмоциональный оттенок.',
    })
  }

  return recs
}