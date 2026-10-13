export const readCssTokens = <Key extends string>(
  element: Element,
  names: Record<Key, string>
): Record<Key, string> => {
  const style = getComputedStyle(element)
  const entries = Object.entries<string>(names).map(([key, name]) => [
    key,
    style.getPropertyValue(name).trim(),
  ])
  return Object.fromEntries(entries) as Record<Key, string>
}
