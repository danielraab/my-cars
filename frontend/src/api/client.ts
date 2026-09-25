import type { components } from './schema.gen'

export type ApiErrorBody = components['schemas']['Error']
export type Session = components['schemas']['Session']
export type MagicLinkRequest = components['schemas']['MagicLinkRequest']

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, 'unauthorized', message)
    this.name = 'UnauthorizedError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSession(value: unknown): value is Session {
  if (!isRecord(value) || !isRecord(value.profile)) return false
  const { id, email, firstName, lastName } = value.profile
  return [id, email, firstName, lastName].every(
    (field) => typeof field === 'string',
  )
}

async function errorFrom(response: Response): Promise<ApiError> {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }

  if (isRecord(body)) {
    const code = typeof body.code === 'string' ? body.code : 'request_failed'
    const message =
      typeof body.message === 'string' ? body.message : response.statusText
    const fields = isRecord(body.fields)
      ? Object.fromEntries(
          Object.entries(body.fields).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : undefined
    return new ApiError(response.status, code, message, fields)
  }

  return new ApiError(
    response.status,
    'request_failed',
    response.statusText || 'Request failed',
  )
}

async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'network_error', 'The server could not be reached')
  }
}

export async function getSession(): Promise<Session> {
  const response = await fetchApi('/api/v1/session')
  if (response.status === 401) throw new UnauthorizedError()
  if (!response.ok) throw await errorFrom(response)

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ApiError(
      502,
      'invalid_response',
      'The server response is invalid',
    )
  }
  if (!isSession(body)) {
    throw new ApiError(
      502,
      'invalid_response',
      'The server response is invalid',
    )
  }
  return body
}

export async function requestMagicLink(input: MagicLinkRequest): Promise<void> {
  const response = await fetchApi('/api/v1/auth/magic-links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) throw await errorFrom(response)
  if (response.status !== 202) {
    throw new ApiError(
      502,
      'invalid_response',
      'The server response is invalid',
    )
  }
}

export async function logout(): Promise<void> {
  const response = await fetchApi('/api/v1/session', { method: 'DELETE' })
  if (response.status === 401) throw new UnauthorizedError()
  if (!response.ok) throw await errorFrom(response)
  if (response.status !== 204) {
    throw new ApiError(
      502,
      'invalid_response',
      'The server response is invalid',
    )
  }
}
