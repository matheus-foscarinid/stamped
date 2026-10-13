import { effectScope } from 'vue'

// runs a composable the way a component would, so its cleanup can be tested
export const mountComposable = <Result>(composable: () => Result) => {
  const scope = effectScope()
  const result = scope.run(composable)
  if (result === undefined) throw new Error('composable did not run')
  return { result, unmount: () => scope.stop() }
}
