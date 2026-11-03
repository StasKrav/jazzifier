import { SEMI } from './notes.js'

export const MAJOR_SCALE = [0,2,4,5,7,9,11]
export const HARMONIC_MINOR_SCALE = [0,2,3,5,7,8,11]

export const ROMAN = ['I','II','III','IV','V','VI','VII']

export function degreeInScale(root, keyRoot, mode) {
  const iv = (SEMI[root] - SEMI[keyRoot] + 12) % 12
  const scale = mode === 'minor' ? HARMONIC_MINOR_SCALE : MAJOR_SCALE
  const idx = scale.indexOf(iv)
  return idx === -1 ? null : idx + 1
}