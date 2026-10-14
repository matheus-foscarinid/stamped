import { effectScope, type ShallowRef, shallowRef } from 'vue'

// runs a composable the way a component would, so its cleanup can be tested
export const mountComposable = <Result>(composable: () => Result) => {
  const scope = effectScope()
  const result = scope.run(composable)
  if (result === undefined) throw new Error('composable did not run')
  return { result, unmount: () => scope.stop() }
}

// the element arrives after the component mounts, like a template ref does
export const mountWithElement = <Element, Result>(
  element: Element,
  composable: (target: ShallowRef<Element | null>) => Result
) => {
  const target = shallowRef<Element | null>(null)
  const { result, unmount } = mountComposable(() => ({ returned: composable(target) }))
  target.value = element
  return { result: result.returned, unmount }
}
