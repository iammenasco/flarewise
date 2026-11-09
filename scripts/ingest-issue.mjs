import fs from 'node:fs'
import path from 'node:path'

const body = process.env.ISSUE_BODY || ''
const match = body.match(/```json\s*([\s\S]*?)\s*```/)

if (!match) {
  console.error('No ```json``` block found in the issue body.')
  process.exit(1)
}

let item
try {
  item = JSON.parse(match[1])
} catch (error) {
  console.error('Failed to parse JSON block from issue body.')
  console.error(error)
  process.exit(1)
}

if (!item || typeof item !== 'object') {
  console.error('Parsed JSON was not an object.')
  process.exit(1)
}

const id = String(item.id || '')
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')

if (!id) {
  console.error('Item id is required.')
  process.exit(1)
}

const folder = item.categoryFolder || 'breakfast'
const targetDir = path.join(process.cwd(), 'src', 'data', 'items', folder)
const targetFile = path.join(targetDir, `${id}.json`)

fs.mkdirSync(targetDir, { recursive: true })
fs.writeFileSync(
  targetFile,
  `${JSON.stringify({ ...item, id }, null, 2)}\n`,
  'utf8',
)

console.log(`Successfully wrote atomic food file: ${targetFile}`)
