// how many values land on each key, for checking how evenly something spreads
export const countBy = <Value>(
  values: readonly Value[],
  toKey: (value: Value) => unknown
): number[] => {
  const counts = new Map<unknown, number>()
  for (const value of values) counts.set(toKey(value), (counts.get(toKey(value)) ?? 0) + 1)
  return [...counts.values()]
}
