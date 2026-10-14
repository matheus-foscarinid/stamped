import { type ComputedRef, computed, type Ref, ref } from 'vue'
import {
  type CountryCode,
  type CountryMark,
  canToggleMark,
  EMPTY_LISTS,
  getCountryMark,
  toggleMark,
} from '@/countries'
import { DEFAULT_PROJECTION, type ProjectionId } from '@/map'
import { useCountryLists } from '@/useCountryLists'

interface UseTravelMapResult {
  projection: ProjectionId
  visited: ComputedRef<readonly CountryCode[]>
  wishlist: ComputedRef<readonly CountryCode[]>
  markedCount: ComputedRef<number>
  markMode: Ref<CountryMark>
  toggleMarkMode: () => void
  getMark: (code: CountryCode) => CountryMark | null
  canToggle: (code: CountryCode) => boolean
  toggleCountry: (code: CountryCode) => void
  clearMap: () => void
  isPassportOpen: Ref<boolean>
  togglePassport: () => void
}

export const useTravelMap = (): UseTravelMapResult => {
  const projection = DEFAULT_PROJECTION
  const { lists, setLists } = useCountryLists()
  const visited = computed(() => lists.value.visited)
  const wishlist = computed(() => lists.value.wishlist)
  const markedCount = computed(() => visited.value.length + wishlist.value.length)

  const markMode = ref<CountryMark>('visited')
  const toggleMarkMode = () => {
    markMode.value = markMode.value === 'visited' ? 'wishlist' : 'visited'
  }

  const isPassportOpen = ref(false)
  const togglePassport = () => {
    isPassportOpen.value = !isPassportOpen.value
  }

  return {
    projection,
    visited,
    wishlist,
    markedCount,
    markMode,
    toggleMarkMode,
    getMark: code => getCountryMark(lists.value, code),
    canToggle: code => canToggleMark(lists.value, code, markMode.value),
    toggleCountry: code => setLists(toggleMark(lists.value, code, markMode.value)),
    clearMap: () => setLists(EMPTY_LISTS),
    isPassportOpen,
    togglePassport,
  }
}
