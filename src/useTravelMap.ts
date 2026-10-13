import { type Ref, ref } from 'vue'
import type { CountryCode } from '@/countries'
import { DEFAULT_PROJECTION, type ProjectionId } from '@/map'
import { readVisitedFromLocation, useVisitedLink } from '@/share/useVisitedLink'

interface UseTravelMapResult {
  projection: Ref<ProjectionId>
  visited: Ref<readonly CountryCode[]>
  isVisited: (code: CountryCode) => boolean
  toggleVisited: (code: CountryCode) => void
}

export const useTravelMap = (): UseTravelMapResult => {
  const projection = ref<ProjectionId>(DEFAULT_PROJECTION)
  // replaced, never mutated, so the map sees every change
  const visited = ref<readonly CountryCode[]>(readVisitedFromLocation())
  useVisitedLink(visited)

  const isVisited = (code: CountryCode) => visited.value.includes(code)

  const toggleVisited = (code: CountryCode) => {
    visited.value = isVisited(code)
      ? visited.value.filter(visitedCode => visitedCode !== code)
      : [...visited.value, code]
  }

  return { projection, visited, isVisited, toggleVisited }
}
