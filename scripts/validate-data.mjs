import fs from 'node:fs'
import path from 'node:path'
import Ajv from 'ajv'

const root = process.cwd()
const schema = JSON.parse(
  fs.readFileSync(path.join(root, 'src', 'data', 'schema.json'), 'utf8'),
)
const ajv = new Ajv({ allErrors: true, strict: false })
const validate = ajv.compile(schema)

const itemsRoot = path.join(root, 'src', 'data', 'items')
const ids = new Map()
let files = 0
let errors = 0

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (!entry.name.endsWith('.json')) continue
    files += 1
    const item = JSON.parse(fs.readFileSync(full, 'utf8'))
    const rel = path.relative(root, full)

    if (!validate(item)) {
      errors += 1
      console.error(`Schema failed: ${rel}`)
      for (const err of validate.errors ?? []) {
        console.error(`  - ${err.instancePath || '/'} ${err.message}`)
      }
    }

    const expectedId = entry.name.replace(/\.json$/, '')
    if (item.id !== expectedId) {
      errors += 1
      console.error(`ID/filename mismatch: ${rel} (id=${item.id})`)
    }

    if (ids.has(item.id)) {
      errors += 1
      console.error(`Duplicate id "${item.id}": ${ids.get(item.id)} and ${rel}`)
    } else {
      ids.set(item.id, rel)
    }

    if (item.citrusFree === undefined) {
      errors += 1
      console.error(`citrusFree missing: ${rel}`)
    }

    if (!Array.isArray(item.tags) || item.tags.length < 2) {
      errors += 1
      console.error(`tags must have at least 2 entries: ${rel}`)
    }

    const expectedTier =
      item.crohnsScore >= 9
        ? 'flare-safe'
        : item.crohnsScore >= 7.5
          ? 'low-risk'
          : item.crohnsScore >= 6.5
            ? 'remission-road'
            : 'danger-zone'
    if (item.safetyTier !== expectedTier) {
      errors += 1
      console.error(
        `safetyTier mismatch in ${rel}: got "${item.safetyTier}" for crohnsScore ${item.crohnsScore} (expected "${expectedTier}")`,
      )
    }

    const brandAndName = `${item.name || ''} ${item.brandOrRestaurant || ''}`
    if (
      /\b(disney\s*(wonder|magic|treasure|cruise)|castaway\s*cay|lookout\s*cay|cruise|disneyland|california\s*adventure|knott'?s\s*berry\s*farm)\b/i.test(
        brandAndName,
      )
    ) {
      const hasVacationTag =
        Array.isArray(item.tags) &&
        item.tags.some((t) =>
          /^(cruise|vacation|theme-park|disney-cruise|disney-wonder|disney-magic|disney-treasure|disneyland|california-adventure|dca|downtown-disney|knotts-berry-farm|knotts)$/i.test(
            String(t).trim(),
          ),
        )
      if (!hasVacationTag) {
        errors += 1
        console.error(
          `Vacation item missing required destination tag ("vacation", "disneyland", "california-adventure", "knotts-berry-farm", or "disney-cruise") in ${rel}`,
        )
      }
    }
  }
}

walk(itemsRoot)

if (files === 0) {
  console.error('No item JSON files found under src/data/items')
  process.exit(1)
}

if (errors > 0) {
  console.error(`Validation failed with ${errors} error(s) across ${files} file(s).`)
  process.exit(1)
}

console.log(`Validated ${files} food item(s).`)
