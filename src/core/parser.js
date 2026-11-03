import { SEMI, ALIASES } from './notes.js'

export function parseChord(s) {
  s = String(s || '').trim()
  if (!s) return null
  const m = s.match(/^([A-G](?:#|b)?)(.*?)(?:\/([A-G](?:#|b)?))?$/i)
  if (!m) return null

  let root = m[1][0].toUpperCase() + m[1].slice(1)
  root = ALIASES[root] || root
  let bass = m[3] || null
  if (bass) {
    bass = bass[0].toUpperCase() + bass.slice(1)
    bass = ALIASES[bass] || bass
  }
  if (!(root in SEMI) || (bass && !(bass in SEMI))) return null

  const suffix = m[2] || ''
  const q = suffix.replace(/\s+/g, '').toLowerCase()
  let type = 'maj', extension = null, altered = []

  if (/^(mmaj7|mmaj9|mmaj)$/.test(q)) type = 'mMaj7'
  else if (/^(m7b5|ø7|ø)$/.test(q)) type = 'm7b5'
  else if (/^(dim7|o7)$/.test(q)) type = 'dim7'
  else if (/^(dim|o)$/.test(q)) type = 'dim'
  else if (/^(aug|\+)$/.test(q)) type = 'aug'
  else if (/^7sus4?$|^7sus$/.test(q)) { type = 'sus7'; altered.push('sus4') }
  else if (/^sus4?$|^sus$/.test(q)) type = 'sus'
  else if (/^(maj|Δ)(7|9|11|13)?$/.test(q)) {
    type = q === 'maj' ? 'maj' : 'maj7'
    extension = (q.match(/(13|11|9|7)/) || [])[1] || null
  }
  else if (/^m(7|9|11|13)?$/.test(q)) {
    type = q === 'm' ? 'm' : 'm7'
    extension = (q.match(/(13|11|9|7)/) || [])[1] || null
  }
  else if (/^(7|9|11|13|7alt)/.test(q)) {
    type = '7'
    extension = (q.match(/(13|11|9)/) || [])[1] || '7'
    if (/#5|b13/.test(q)) altered.push('#5/b13')
    if (/#9/.test(q)) altered.push('#9')
    if (/b9/.test(q)) altered.push('b9')
    if (/#11/.test(q)) altered.push('#11')
  }
  else if (q !== '') return null

  return { name: s, root, type, original: s, bass, extension, altered, suffix }
}

export function parseSequence(text) {
  const tokens = String(text || '').trim().split(/\s+/).filter(Boolean)
  const chords = [], errors = []
  tokens.forEach((t, i) => {
    const c = parseChord(t)
    if (c) chords.push(c)
    else errors.push({ index: i, token: t })
  })
  return { chords, errors }
}