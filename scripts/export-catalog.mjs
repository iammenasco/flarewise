import fs from 'node:fs'
import path from 'node:path'

const SITE_ORIGIN = 'https://flarewise.menas.co'
const root = process.cwd()
const itemsRoot = path.join(root, 'src', 'data', 'items')
const schema = JSON.parse(
  fs.readFileSync(path.join(root, 'src', 'data', 'schema.json'), 'utf8'),
)
const rubric = JSON.parse(
  fs.readFileSync(path.join(root, 'src', 'data', 'rubric.json'), 'utf8'),
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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function tierLabel(tier) {
  switch (tier) {
    case 'flare-safe':
      return 'Flare safe'
    case 'low-risk':
      return 'Everyday'
    case 'remission-road':
      return 'Careful'
    case 'danger-zone':
      return 'Avoid'
    default:
      return 'Food'
  }
}

function shareDescription(item) {
  const bits = [
    tierLabel(item.safetyTier),
    item.region,
    `${item.fiberGramsPerServing}g fiber`,
  ]
  if (item.lactoseSafe) bits.push('lactose-safe')
  const lead = bits.join(' · ')
  const why = String(item.whyItWorks || '').trim()
  const clipped = why.length > 160 ? `${why.slice(0, 157)}…` : why
  return clipped ? `${lead}. ${clipped}` : `${lead}. Crohn's-friendly pick on Flarewise.`
}

function writeFoodSharePage(item) {
  const id = item.id
  const title = `${item.name} · Flarewise`
  const description = shareDescription(item)
  const shareUrl = `${SITE_ORIGIN}/f/${encodeURIComponent(id)}/`
  const appUrl = `${SITE_ORIGIN}/#/?item=${encodeURIComponent(id)}`
  const imageUrl = `${SITE_ORIGIN}/og.png`
  const brand = item.brandOrRestaurant
    ? escapeHtml(item.brandOrRestaurant)
    : ''

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="theme-color" content="#368dda" />
    <link rel="canonical" href="${shareUrl}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/icons/icon-180.png" />

    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Flarewise" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${shareUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Flarewise — Crohn's-friendly food catalog" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />

    <meta http-equiv="refresh" content="0;url=${appUrl}" />
    <script>
      location.replace(${JSON.stringify(appUrl)});
    </script>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
        background: linear-gradient(160deg, #e8f3fb, #f7fbfd 55%, #eef7f2);
        color: #16324a;
      }
      main {
        width: min(28rem, calc(100% - 2rem));
        padding: 1.25rem 1.35rem;
        border-radius: 1.25rem;
        background: rgba(255,255,255,0.88);
        border: 1px solid rgba(54,141,218,0.18);
        box-shadow: 0 18px 50px rgba(22,50,74,0.08);
      }
      .eyebrow {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #368dda;
        margin: 0 0 0.55rem;
      }
      h1 {
        margin: 0;
        font-size: 1.45rem;
        line-height: 1.25;
        font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
      }
      .meta {
        margin: 0.55rem 0 0;
        color: rgba(22,50,74,0.62);
        font-size: 0.92rem;
      }
      p { margin: 0.85rem 0 0; line-height: 1.45; }
      a {
        display: inline-block;
        margin-top: 1rem;
        color: #368dda;
        font-weight: 700;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">Flarewise</p>
      <h1>${escapeHtml(item.name)}</h1>
      <p class="meta">
        ${escapeHtml(tierLabel(item.safetyTier))}
        ${brand ? ` · ${brand}` : ''}
        · ${escapeHtml(item.region)}
        · ${escapeHtml(String(item.fiberGramsPerServing))}g fiber
      </p>
      <p>${escapeHtml(item.whyItWorks)}</p>
      <a href="${appUrl}">Open in Flarewise</a>
    </main>
  </body>
</html>
`

  const dir = path.join(root, 'public', 'f', id)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8')
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
  rubricPath: '/rubric.json',
  submitPath: '/#/submit',
  sharePathTemplate: '/f/{id}/',
  githubLabels: ['new-food', 'approved-food', 'data-ingestion'],
  // Agent scoring SoT — also published as /rubric.json (no extra HomeBot RTT: already on catalog fetch).
  rubric,
  items,
}

const publicDir = path.join(root, 'public')
const shareRoot = path.join(publicDir, 'f')
fs.mkdirSync(publicDir, { recursive: true })
fs.rmSync(shareRoot, { recursive: true, force: true })
fs.mkdirSync(shareRoot, { recursive: true })

for (const item of items) writeFoodSharePage(item)

fs.writeFileSync(
  path.join(publicDir, 'catalog.json'),
  `${JSON.stringify(payload, null, 2)}\n`,
)
fs.writeFileSync(
  path.join(publicDir, 'build-info.json'),
  `${JSON.stringify({ builtAt, itemCount: items.length, version: '1.0.0' }, null, 2)}\n`,
)

// Keep schema + rubric discoverable next to the export
fs.copyFileSync(
  path.join(root, 'src', 'data', 'schema.json'),
  path.join(publicDir, 'schema.json'),
)
fs.writeFileSync(
  path.join(publicDir, 'rubric.json'),
  `${JSON.stringify(rubric, null, 2)}\n`,
)

console.log(
  `Exported ${items.length} items to public/catalog.json + rubric.json + ${items.length} share pages under public/f/`,
)
