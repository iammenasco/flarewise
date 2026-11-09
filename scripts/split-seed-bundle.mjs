import fs from 'node:fs'
import path from 'node:path'

const bundlePath = path.join(process.cwd(), 'scripts', 'seed-bundle.json')
const items = JSON.parse(fs.readFileSync(bundlePath, 'utf8'))

if (!Array.isArray(items) || items.length === 0) {
  console.error('seed-bundle.json must be a non-empty array')
  process.exit(1)
}

for (const item of items) {
  if (!item?.id || !item?.categoryFolder) {
    console.error('Item missing id or categoryFolder:', item)
    process.exit(1)
  }

  const dir = path.join(process.cwd(), 'src', 'data', 'items', item.categoryFolder)
  fs.mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, `${item.id}.json`)
  fs.writeFileSync(filePath, `${JSON.stringify(item, null, 2)}\n`, 'utf8')
}

console.log(`Split ${items.length} items into atomic JSON files.`)
