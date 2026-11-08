// the numeric prefix sets the order, so 010 runs after 009
export const listPendingMigrations = (
  files: readonly string[],
  applied: readonly string[]
): string[] =>
  files
    .filter(file => file.endsWith('.sql') && !applied.includes(file))
    .sort((a, b) => a.localeCompare(b))
