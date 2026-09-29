// Money arrives as decimal strings (`^-?[0-9]+(\.[0-9]+)?$`). Adding them as
// JavaScript numbers drifts (0.1 + 0.2 is 0.30000000000000004), so sums are
// computed on integers scaled to the most fraction digits in the input.

const decimal = /^(-?)(\d+)(?:\.(\d+))?$/

export function sumDecimals(values: readonly string[]): string {
  const parsed = values.map((value) => {
    const match = decimal.exec(value)
    if (!match) throw new RangeError(`Invalid decimal: ${value}`)
    return {
      negative: match[1] === '-',
      whole: match[2],
      fraction: match[3] ?? '',
    }
  })
  const scale = Math.max(0, ...parsed.map((p) => p.fraction.length))
  let total = 0n
  for (const { negative, whole, fraction } of parsed) {
    const units = BigInt(whole + fraction.padEnd(scale, '0'))
    total += negative ? -units : units
  }
  const sign = total < 0n ? '-' : ''
  const digits = (total < 0n ? -total : total)
    .toString()
    .padStart(scale + 1, '0')
  if (scale === 0) return sign + digits
  return `${sign}${digits.slice(0, -scale)}.${digits.slice(-scale)}`
}
