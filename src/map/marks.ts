import type { MarkState } from './renderer.ts'

export interface CountryMarks {
  visited: Iterable<string>
  wishlist: Iterable<string>
}

interface MarkChange {
  marks: Map<string, MarkState>
  changed: string[]
  fadingFrom: Map<string, MarkState>
}

// a code on both lists draws as visited
export const toMarkStates = ({ visited, wishlist }: CountryMarks): Map<string, MarkState> => {
  const states = new Map<string, MarkState>()
  for (const code of wishlist) states.set(code, 'wishlist')
  for (const code of visited) states.set(code, 'visited')
  return states
}

interface MarkChangeInput {
  previous: ReadonlyMap<string, MarkState>
  next: CountryMarks
  // codes still mid fade keep the state they fade from
  fading: ReadonlyMap<string, MarkState>
}

export const changeMarks = ({ previous, next, fading }: MarkChangeInput): MarkChange => {
  const marks = toMarkStates(next)
  const codes = new Set([...previous.keys(), ...marks.keys()])
  const changed = [...codes].filter(code => previous.get(code) !== marks.get(code))
  const fadingFrom = new Map(fading)
  for (const code of changed) fadingFrom.set(code, previous.get(code) ?? 'unmarked')
  return { marks, changed, fadingFrom }
}
