// Renders the committed app icon PNGs and favicon.ico from the SVG sources in
// public/. Run by hand after editing an icon SVG (see README "App icon"); the
// outputs are committed, nothing runs at build time.
//
// Needs chrome-headless-shell, whose --window-size is the exact viewport (the
// regular Chrome binary's new headless mode subtracts window decorations and
// crops the render): CHROME=/path/to/chrome-headless-shell node scripts/render-app-icons.mjs
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const chrome = process.env.CHROME || 'chrome-headless-shell'
const publicDir = resolve(import.meta.dirname, '../public')
const work = mkdtempSync(join(tmpdir(), 'app-icons-'))

// [output, source SVG, size]. Sources with transparent corners keep them; the
// maskable source is full-bleed, so its renders are opaque.
const targets = [
  ['icon-192.png', 'icon.svg', 192],
  ['icon-512.png', 'icon.svg', 512],
  ['icon-maskable-512.png', 'icon-maskable.svg', 512],
  ['apple-touch-icon.png', 'icon-maskable.svg', 180],
]
const icoSizes = [16, 32]

function render(source, size, output) {
  const page = join(work, `${size}-${source}.html`)
  writeFileSync(
    page,
    `<!doctype html><body style="margin:0"><img src="file://${join(publicDir, source)}" style="display:block;width:${size}px;height:${size}px">`,
  )
  execFileSync(chrome, [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--default-background-color=00000000',
    `--window-size=${size},${size}`,
    `--screenshot=${output}`,
    `file://${page}`,
  ])
}

// An ICO whose entries embed PNG data, which every current browser reads.
function packIco(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)
  let offset = header.length
  pngs.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i
    header.writeUInt8(size, entry)
    header.writeUInt8(size, entry + 1)
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(data.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += data.length
  })
  return Buffer.concat([header, ...pngs.map(({ data }) => data)])
}

try {
  for (const [output, source, size] of targets) {
    render(source, size, join(publicDir, output))
  }
  const icoPngs = icoSizes.map((size) => {
    const output = join(work, `favicon-${size}.png`)
    render('icon.svg', size, output)
    return { size, data: readFileSync(output) }
  })
  writeFileSync(join(publicDir, 'favicon.ico'), packIco(icoPngs))
} finally {
  rmSync(work, { recursive: true, force: true })
}
