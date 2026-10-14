import { onBeforeUnmount, onMounted, type Ref, ref, type ShallowRef, watch } from 'vue'
import { type CountryCode, isCountryCode } from '@/countries'
import { type CountryMarks, createWorldMap, type ProjectionId, type WorldMap } from '@/map'

const ZOOM_STEP = 1.6

interface UseWorldMapInput {
  canvas: Readonly<ShallowRef<HTMLCanvasElement | null>>
  projection: () => ProjectionId
  marks: () => CountryMarks
  onToggle: (code: CountryCode) => void
}

interface UseWorldMapResult {
  hasLoadError: Ref<boolean>
  hoveredCode: Ref<CountryCode | null>
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

export const useWorldMap = (input: UseWorldMapInput): UseWorldMapResult => {
  const hasLoadError = ref(false)
  const hoveredCode = ref<CountryCode | null>(null)
  let map: WorldMap | null = null
  let isUnmounted = false
  const reportError = () => {
    hasLoadError.value = true
  }

  const mountMap = async (element: HTMLCanvasElement) => {
    const created = await createWorldMap(element, {
      projection: input.projection(),
      isSelectable: isCountryCode,
      onCountryClick: code => isCountryCode(code) && input.onToggle(code),
      onCountryHover: code => {
        hoveredCode.value = code && isCountryCode(code) ? code : null
      },
    })
    // the component may have gone away while the map file was loading
    if (isUnmounted) return created.destroy()
    created.setMarks(input.marks())
    map = created
  }

  onMounted(() => {
    if (input.canvas.value) mountMap(input.canvas.value).catch(reportError)
  })
  watch(input.projection, next => map?.setProjection(next).catch(reportError))
  watch(input.marks, next => map?.setMarks(next))
  onBeforeUnmount(() => {
    isUnmounted = true
    map?.destroy()
  })

  return {
    hasLoadError,
    hoveredCode,
    zoomIn: () => map?.zoomBy(ZOOM_STEP),
    zoomOut: () => map?.zoomBy(1 / ZOOM_STEP),
    resetZoom: () => map?.resetZoom(),
  }
}
