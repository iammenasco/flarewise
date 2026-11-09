import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const itemsRoot = path.join(root, 'src', 'data', 'items')
const schema = JSON.parse(
  fs.readFileSync(path.join(root, 'src', 'data', 'schema.json'), 'utf8'),
)

const items = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (!entry.name.endsWith('.json')) continue
    const item = JSON.parse(fs.readFileSync(full, 'utf8'))
    items.push({
      ...item,
      _sourcePath: path.relative(root, full).replaceAll('\\', '/'),
    })
  }
}

walk(itemsRoot)
items.sort((a, b) => b.crohnsScore - a.crohnsScore || a.name.localeCompare(b.name))

const builtAt = new Date().toISOString()
const payload = {
  name: 'Flarewise',
  description:
    "Crohn's-friendly food catalog. Static JSON export for humans, apps, and AI agents.",
  builtAt,
  itemCount: items.length,
  schemaTitle: schema.title,
  schemaPath: 'src/data/schema.json',
  submitPath: '/#/submit',
  githubLabels: ['new-food', 'approved-food', 'data-ingestion'],
  items,
}

const publicDir = path.join(root, 'public')
fs.mkdirSync(publicDir, { recursive: true })
fs.writeFileSync(
  path.join(publicDir, 'catalog.json'),
  `${JSON.stringify(payload, null, 2)}\n`,
)
fs.writeFileSync(
  path.join(publicDir, 'build-info.json'),
  `${JSON.stringify({ builtAt, itemCount: items.length, version: '1.0.0' }, null, 2)}\n`,
)

// Keep schema discoverable next to the export
fs.copyFileSync(
  path.join(root, 'src', 'data', 'schema.json'),
  path.join(publicDir, 'schema.json'),
)

console.log(`Exported ${items.length} items to public/catalog.json`)
