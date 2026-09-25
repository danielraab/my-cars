export const defaultReturnTo = '/home'

export function validReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return defaultReturnTo
  }
  if (value.includes('\\')) return defaultReturnTo

  try {
    decodeURI(value)
    const parsed = new URL(value, window.location.origin)
    if (
      parsed.origin !== window.location.origin ||
      parsed.username ||
      parsed.password
    ) {
      return defaultReturnTo
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return defaultReturnTo
  }
}

export function oidcStartUrl(returnTo: string): string {
  const parameters = new URLSearchParams({ returnTo: validReturnTo(returnTo) })
  return `/api/v1/auth/oidc/start?${parameters}`
}
