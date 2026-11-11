#!/usr/bin/env node
/**
 * Rasterize Flarewise icons from SVG.
 * - Favicon / any-purpose icons: rounded tile with real alpha (no white corners).
 * - Apple touch + maskable: full-bleed square (OS applies the mask).
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const iconsDir = join(publicDir, 'icons')
mkdirSync(iconsDir, { recursive: true })

const MARK = `
  <path fill="MARK" d="M14 40c0-1.2.5-2.3 1.4-3.1C20.2 32.3 26.7 30 32 30s11.8 2.3 16.6 6.9c.9.8 1.4 1.9 1.4 3.1v1.2c0 1.3-1.1 2.4-2.4 2.4H16.4c-1.3 0-2.4-1.1-2.4-2.4V40z"/>
  <path fill="none" stroke="MARK" stroke-width="4" stroke-linecap="round" d="M18 28c4.8-7.2 11-10.8 14-10.8 3.2 0 8.8 3.2 13.2 9.6"/>
  <circle cx="45.5" cy="27.2" r="3.4" fill="MARK"/>
`

function svgTile({ bg, mark, rounded }) {
  const rect = rounded
    ? `<rect width="64" height="64" rx="14" fill="${bg}"/>`
    : `<rect width="64" height="64" fill="${bg}"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${rect}${MARK.replaceAll('MARK', mark)}</svg>`
}

function whichRsvg() {
  try {
    execFileSync('rsvg-convert', ['--version'], { stdio: 'ignore' })
    return 'rsvg-convert'
  } catch {
    throw new Error(
      'rsvg-convert is required (brew install librsvg). npm run icons failed.',
    )
  }
}

function render(svg, outPath, size) {
  const bin = whichRsvg()
  execFileSync(
    bin,
    ['-w', String(size), '-h', String(size), '-f', 'png', '-o', outPath],
    { input: svg, stdio: ['pipe', 'inherit', 'inherit'] },
  )
}

const lightRounded = svgTile({ bg: '#368dda', mark: '#ffffff', rounded: true })
const lightBleed = svgTile({ bg: '#368dda', mark: '#ffffff', rounded: false })

writeFileSync(join(publicDir, 'favicon.svg'), lightRounded)
writeFileSync(
  join(publicDir, 'favicon-dark.svg'),
  svgTile({ bg: '#5ba4e8', mark: '#0f2740', rounded: true }),
)

render(lightRounded, join(publicDir, 'favicon.png'), 32)
render(lightRounded, join(iconsDir, 'icon-32.png'), 32)
render(lightRounded, join(iconsDir, 'icon-64.png'), 64)
render(lightRounded, join(iconsDir, 'icon-128.png'), 128)
render(lightBleed, join(iconsDir, 'icon-180.png'), 180)
render(lightBleed, join(iconsDir, 'icon-192.png'), 192)
render(lightBleed, join(iconsDir, 'icon-512.png'), 512)
render(lightBleed, join(iconsDir, 'icon-1024.png'), 1024)

console.log('Wrote favicon + icons with alpha (rounded) and full-bleed apple/maskable.')
