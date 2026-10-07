import { render } from '@testing-library/react'
import { Gauge } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import indexHtml from '../index.html?raw'
import iconSvg from '../public/icon.svg?raw'
import maskableSvg from '../public/icon-maskable.svg?raw'
import manifestJson from '../public/manifest.webmanifest?raw'

const publicFiles = Object.keys(import.meta.glob('../public/*')).map((path) =>
  path.replace('../public', ''),
)

// The app icon files copy the header's lucide Gauge glyph by hand; fail when a
// lucide upgrade redraws it so the files can be re-derived (see README).
function gaugePaths() {
  const { container } = render(<Gauge />)
  return Array.from(container.querySelectorAll('path'), (path) =>
    path.getAttribute('d'),
  )
}

describe('app icon', () => {
  it.each([
    ['icon.svg', iconSvg],
    ['icon-maskable.svg', maskableSvg],
  ])('%s contains the lucide Gauge glyph', (_name, svg) => {
    const paths = gaugePaths()
    expect(paths.length).toBeGreaterThan(0)
    for (const d of paths) expect(svg).toContain(`d="${d}"`)
  })
})

describe('web app manifest', () => {
  const manifest = JSON.parse(manifestJson)

  it('installs as a standalone "My cars" app opening at /home', () => {
    expect(manifest).toMatchObject({
      name: 'My cars',
      short_name: 'My cars',
      start_url: '/home',
      scope: '/',
      display: 'standalone',
      theme_color: '#142721',
      background_color: '#142721',
    })
  })

  it('lists the any and maskable icons, all present in public/', () => {
    expect(manifest.icons).toEqual([
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ])
    for (const icon of manifest.icons) expect(publicFiles).toContain(icon.src)
  })
})

describe('index.html head', () => {
  const head = new DOMParser().parseFromString(indexHtml, 'text/html').head

  it('names the product and uses the brand navy theme color', () => {
    expect(head.querySelector('title')?.textContent).toBe('My cars')
    expect(
      head.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
    ).toBe('#142721')
  })

  it.each([
    ['link[rel="icon"][type="image/svg+xml"]', '/icon.svg'],
    ['link[rel="icon"][sizes="32x32"]', '/favicon.ico'],
    ['link[rel="apple-touch-icon"]', '/apple-touch-icon.png'],
    ['link[rel="manifest"]', '/manifest.webmanifest'],
  ])('links %s to %s in public/', (selector, href) => {
    expect(head.querySelector(selector)?.getAttribute('href')).toBe(href)
    expect(publicFiles).toContain(href)
  })
})
