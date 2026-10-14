// fails the build output on what should never be deployed: source maps, which carry
// the original source, oversized files, usually a dump that landed in public/, and
// split-off script files
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const DIST = new URL('../dist', import.meta.url).pathname
// the whole app is meant to stay tiny. anything past this is almost always an accident
const MAX_FILE_BYTES = 512 * 1024

const listFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })

const describeProblem = (path: string): string | null => {
  if (path.endsWith('.map')) return 'source map'
  // the entry is inlined into index.html, so a lazy chunk can't import shared code back from it
  if (path.endsWith('.js'))
    return 'separate script, a dynamic import split it off the inlined entry'
  const { size } = statSync(path)
  if (size > MAX_FILE_BYTES) return `${(size / 1024).toFixed(0)}KB`
  return null
}

const problems = listFiles(DIST).flatMap(path => {
  const problem = describeProblem(path)
  return problem ? [`${relative(DIST, path)}: ${problem}`] : []
})

if (problems.length > 0) {
  console.error(`dist/ has files that must not ship:\n${problems.join('\n')}`)
  process.exit(1)
}
console.log('dist/ is clean')
