import fs from 'node:fs'
import path from 'node:path'

const issuesFilePath = process.argv[2] || '/tmp/all-issues.json'

if (!fs.existsSync(issuesFilePath)) {
  console.error(`Issues file not found: ${issuesFilePath}`)
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(issuesFilePath, 'utf8'))
console.log(`Processing ${data.length} issues from ${issuesFilePath}...`)

let writtenCount = 0
let skippedCount = 0

for (const issue of data) {
  const match = issue.body.match(/```json\s*([\s\S]*?)\s*```/)
  if (!match) {
    console.warn(`No JSON block found in issue #${issue.number}`)
    skippedCount++
    continue
  }

  let item
  try {
    item = JSON.parse(match[1])
  } catch (err) {
    console.error(`JSON parse error in issue #${issue.number}: ${err.message}`)
    skippedCount++
    continue
  }

  const id = String(item.id || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!id) {
    console.warn(`Missing id in issue #${issue.number}`)
    skippedCount++
    continue
  }

  const folder = item.categoryFolder || 'breakfast'
  const targetDir = path.join(process.cwd(), 'src', 'data', 'items', folder)
  const targetFile = path.join(targetDir, `${id}.json`)

  const score = Number(item.crohnsScore)
  const safetyTier =
    score >= 9
      ? 'flare-safe'
      : score >= 7.5
        ? 'low-risk'
        : score >= 6.5
          ? 'remission-road'
          : 'danger-zone'

  const tagSet = new Set(
    Array.isArray(item.tags)
      ? item.tags.map((t) => String(t).trim()).filter(Boolean)
      : [],
  )
  const text = `${item.name || ''} ${item.brandOrRestaurant || ''}`
  if (/\bdisneyland\b|\bdowntown\s*disney\b/i.test(text)) {
    tagSet.add('vacation')
    tagSet.add('disneyland')
  }
  if (/\bcalifornia\s*adventure\b|\bdca\b/i.test(text)) {
    tagSet.add('vacation')
    tagSet.add('california-adventure')
  }
  if (/\bknott'?s(\s*berry\s*farm)?\b/i.test(text)) {
    tagSet.add('vacation')
    tagSet.add('knotts-berry-farm')
  }
  if (
    /\b(disney\s*(wonder|magic|treasure|cruise)|castaway\s*cay|lookout\s*cay)\b/i.test(
      text,
    )
  ) {
    tagSet.add('disney-cruise')
    if (/\bdisney\s*wonder\b|\bwonder\b/i.test(text)) tagSet.add('disney-wonder')
    if (/\bdisney\s*magic\b|\bmagic\b/i.test(text)) tagSet.add('disney-magic')
    if (/\bdisney\s*treasure\b|\btreasure\b/i.test(text))
      tagSet.add('disney-treasure')
  } else if (/\bcruise\b/i.test(text) && !tagSet.has('disney-cruise')) {
    tagSet.add('cruise')
  }

  fs.mkdirSync(targetDir, { recursive: true })
  fs.writeFileSync(
    targetFile,
    `${JSON.stringify({ ...item, id, safetyTier, tags: Array.from(tagSet) }, null, 2)}\n`,
    'utf8',
  )
  writtenCount++
}

console.log(`Bulk ingestion complete: wrote ${writtenCount} items, skipped ${skippedCount}.`)
