// private windows and strict privacy settings throw on any storage access
export const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

// a blocked write keeps the value for this visit only
export const writeStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {}
}
