// a window dragged to a screen with another pixel density keeps its css size, so no resize fires
export const watchPixelRatio = (onChange: () => void): (() => void) => {
  let query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
  const handleChange = () => {
    query.removeEventListener('change', handleChange)
    query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    query.addEventListener('change', handleChange)
    onChange()
  }
  query.addEventListener('change', handleChange)
  return () => query.removeEventListener('change', handleChange)
}
