import type { Ref } from 'vue'
import type { CountryCode } from '@/countries'
import { DEFAULT_PROJECTION, type ProjectionId } from '@/map'
import { useVisitedCountries } from '@/useVisitedCountries'

interface UseTravelMapResult {
  projection: ProjectionId
  visited: Readonly<Ref<readonly CountryCode[]>>
  isVisited: (code: CountryCode) => boolean
  toggleVisited: (code: CountryCode) => void
}

export const useTravelMap = (): UseTravelMapResult => {
  const projection = DEFAULT_PROJECTION
  // replaced, never mutated, so the map sees every change
  const { visited, setVisited } = useVisitedCountries()

  const isVisited = (code: CountryCode) => visited.value.includes(code)

  const toggleVisited = (code: CountryCode) => {
    setVisited(
      isVisited(code)
        ? visited.value.filter(visitedCode => visitedCode !== code)
        : [...visited.value, code]
    )
  }

  return { projection, visited, isVisited, toggleVisited }
}
