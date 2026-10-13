import { onBeforeUnmount, onMounted, type Ref, ref, type ShallowRef, watch } from 'vue'
import { createWorldMap, type ProjectionId, type WorldMap } from '@/map'

interface UseWorldMapInput {
  canvas: Readonly<ShallowRef<HTMLCanvasElement | null>>
  projection: () => ProjectionId
  visited: () => readonly string[]
}

interface UseWorldMapResult {
  hasLoadError: Ref<boolean>
}

export const useWorldMap = ({
  canvas,
  projection,
  visited,
}: UseWorldMapInput): UseWorldMapResult => {
  const hasLoadError = ref(false)
  let map: WorldMap | null = null
  let isUnmounted = false
  const reportError = () => {
    hasLoadError.value = true
  }

  const mountMap = async (element: HTMLCanvasElement) => {
    const created = await createWorldMap(element, { projection: projection() })
    // the component may have gone away while the map file was loading
    if (isUnmounted) return created.destroy()
    created.setVisited(visited())
    map = created
  }

  onMounted(() => {
    if (canvas.value) mountMap(canvas.value).catch(reportError)
  })
  watch(projection, next => map?.setProjection(next).catch(reportError))
  watch(visited, next => map?.setVisited(next))
  onBeforeUnmount(() => {
    isUnmounted = true
    map?.destroy()
  })

  return { hasLoadError }
}
