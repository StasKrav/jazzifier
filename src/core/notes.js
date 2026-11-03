export const NOTES = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
export const SEMI = { C:0, Db:1, D:2, Eb:3, E:4, F:5, Gb:6, G:7, Ab:8, A:9, Bb:10, B:11 }
export const ALIASES = { 'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb' }

export const transposeRoot = (root, semitones) =>
  NOTES[(SEMI[root] + semitones + 12) % 12]

export const interval = (from, to) =>
  (SEMI[to] - SEMI[from] + 12) % 12