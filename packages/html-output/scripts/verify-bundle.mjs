/**
 * Verify the bundle patch is self-consistent: every `name` inserted by
 * cordis.patch.yml must resolve through the dependencies of the package that
 * owns the patch (itself included), or the loader will fail to find the row.
 * Runs after build; exits non-zero on mismatch.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const packageDir = dirname(fileURLToPath(import.meta.url))
const patch = readFileSync(join(packageDir, '..', 'cordis.patch.yml'), 'utf8')
const manifest = JSON.parse(readFileSync(join(packageDir, '..', 'package.json'), 'utf8'))

/** Pull every `name: '<pkg>'` row out of the patch (loader YAML uses single quotes). */
const insertedNames = [...patch.matchAll(/^\s+name:\s*'([^']+)'/gm)].map((m) => m[1])

if (insertedNames.length === 0) {
  console.error('bundle patch inserts no rows')
  process.exit(1)
}

const resolvable = new Set([
  manifest.name,
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.peerDependencies ?? {}),
])

const missing = insertedNames.filter((name) => !resolvable.has(name))
if (missing.length > 0) {
  console.error(`bundle patch references unresolvable package(s): ${missing.join(', ')}`)
  process.exit(1)
}

console.log(`bundle patch OK: ${insertedNames.join(', ')} all resolvable`)
