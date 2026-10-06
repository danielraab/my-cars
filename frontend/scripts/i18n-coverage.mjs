// Reports per-locale translation coverage against en (the source of truth).
//
// Exits 1 when any locale is missing keys, so a local run fails visibly. In
// GitHub Actions it also writes a markdown report to $RUNNER_TEMP and sets the
// `has_shortfall` step output. Needs Node with native TypeScript stripping.
import { appendFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { resources } from '../src/i18n/resources.ts'

const SOURCE = 'en'

function flatten(node, prefix = '') {
  return Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return value !== null && typeof value === 'object'
      ? flatten(value, path)
      : [path]
  })
}

const keysOf = (locale) => new Set(flatten(resources[locale].translation))
const sourceKeys = keysOf(SOURCE)

const rows = Object.keys(resources)
  .filter((locale) => locale !== SOURCE)
  .map((locale) => {
    const keys = keysOf(locale)
    const missing = [...sourceKeys].filter((key) => !keys.has(key))
    const extra = [...keys].filter((key) => !sourceKeys.has(key))
    const covered = sourceKeys.size - missing.length
    return {
      locale,
      missing,
      extra,
      covered,
      percent: (covered / sourceKeys.size) * 100,
    }
  })

const hasShortfall = rows.some((row) => row.missing.length > 0)

for (const row of rows) {
  console.log(
    `${row.locale}: ${row.covered}/${sourceKeys.size} (${row.percent.toFixed(1)}%)`,
  )
  for (const key of row.missing) console.log(`  missing: ${key}`)
  for (const key of row.extra) console.log(`  not in ${SOURCE}: ${key}`)
}

const report = [
  '<!-- i18n-coverage-report -->',
  '### Translation coverage',
  '',
  `Measured against \`${SOURCE}\` (${sourceKeys.size} keys).`,
  '',
  '| Locale | Coverage | Missing | Not in source |',
  '| --- | --- | --- | --- |',
  ...rows.map(
    (row) =>
      `| ${row.locale} | ${row.percent.toFixed(1)}% | ${row.missing.length} | ${row.extra.length} |`,
  ),
  ...rows
    .filter((row) => row.missing.length > 0)
    .flatMap((row) => [
      '',
      `<details><summary>Missing in <code>${row.locale}</code></summary>`,
      '',
      ...row.missing.map((key) => `- \`${key}\``),
      '',
      '</details>',
    ]),
  '',
].join('\n')

if (process.env.RUNNER_TEMP) {
  writeFileSync(join(process.env.RUNNER_TEMP, 'i18n-coverage-report.md'), report)
}
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `has_shortfall=${hasShortfall}\n`)
}

process.exit(hasShortfall ? 1 : 0)
