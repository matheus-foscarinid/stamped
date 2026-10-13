import { type Ref, ref } from 'vue'
import type { CountryCode } from '@/countries'
import type { ProjectionId } from '@/map'

interface UseTravelMapResult {
  projection: Ref<ProjectionId>
  visited: Ref<readonly CountryCode[]>
  isVisited: (code: CountryCode) => boolean
  toggleVisited: (code: CountryCode) => void
}

export const useTravelMap = (): UseTravelMapResult => {
  const projection = ref<ProjectionId>('equal-earth')
  // replaced, never mutated, so the map sees every change
  const visited = ref<readonly CountryCode[]>([])

  const isVisited = (code: CountryCode) => visited.value.includes(code)

  const toggleVisited = (code: CountryCode) => {
    visited.value = isVisited(code)
      ? visited.value.filter(visitedCode => visitedCode !== code)
      : [...visited.value, code]
  }

  return { projection, visited, isVisited, toggleVisited }
}
