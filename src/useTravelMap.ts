import { type ComputedRef, computed, type Ref, ref } from 'vue'
import {
  type CountryCode,
  type CountryMark,
  EMPTY_LISTS,
  getCountryMark,
  toggleVisited,
  toggleWishlisted,
} from '@/countries'
import { DEFAULT_PROJECTION, type ProjectionId } from '@/map'
import { useCountryLists } from '@/useCountryLists'

interface UseTravelMapResult {
  projection: ProjectionId
  visited: ComputedRef<readonly CountryCode[]>
  wishlist: ComputedRef<readonly CountryCode[]>
  markedCount: ComputedRef<number>
  getMark: (code: CountryCode) => CountryMark | null
  toggleCountry: (code: CountryCode) => void
  clearMap: () => void
  isWishlistMode: Ref<boolean>
  toggleWishlistMode: () => void
  isPassportOpen: Ref<boolean>
  togglePassport: () => void
}

export const useTravelMap = (): UseTravelMapResult => {
  const projection = DEFAULT_PROJECTION
  // replaced, never mutated, so the map sees every change
  const { lists, setLists } = useCountryLists()
  const visited = computed(() => lists.value.visited)
  const wishlist = computed(() => lists.value.wishlist)
  const markedCount = computed(() => visited.value.length + wishlist.value.length)

  const isWishlistMode = ref(false)
  const toggleWishlistMode = () => {
    isWishlistMode.value = !isWishlistMode.value
  }

  const toggleCountry = (code: CountryCode) => {
    const toggle = isWishlistMode.value ? toggleWishlisted : toggleVisited
    setLists(toggle(lists.value, code))
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
    getMark: code => getCountryMark(lists.value, code),
    toggleCountry,
    clearMap: () => setLists(EMPTY_LISTS),
    isWishlistMode,
    toggleWishlistMode,
    isPassportOpen,
    togglePassport,
  }
}
