import type { components } from './schema.gen'

export type ApiErrorBody = components['schemas']['Error']
export type Session = components['schemas']['Session']
export type Profile = components['schemas']['Profile']
export type ProfileUpdate = components['schemas']['ProfileUpdate']
export type MagicLinkRequest = components['schemas']['MagicLinkRequest']
export type AuthenticationMethods =
  components['schemas']['AuthenticationMethods']
export type Car = components['schemas']['Car']
export type CarFuel = Car['fuel']
type GeneratedCarInput = components['schemas']['CarInput']
// The generator marks defaulted members as required; isActive may be omitted.
export type CarInput = Omit<GeneratedCarInput, 'isActive'> &
  Partial<Pick<GeneratedCarInput, 'isActive'>>
export type CarUpdate = components['schemas']['CarUpdate']
export type CarPage = components['schemas']['CarPage']

export const carFuels: readonly CarFuel[] = [
  'gasoline',
  'diesel',
  'electric',
  'other',
]

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

function isProfile(value: unknown): value is Profile {
  if (!isRecord(value)) return false
  const { id, email, firstName, lastName } = value
  return [id, email, firstName, lastName].every(
    (field) => typeof field === 'string',
  )
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isCar(value: unknown): value is Car {
  if (!isRecord(value)) return false
  const required = [
    value.id,
    value.type,
    value.make,
    value.name,
    value.firstRegistration,
    value.licensePlate,
    value.createdAt,
    value.updatedAt,
  ]
  return (
    required.every((field) => typeof field === 'string') &&
    carFuels.some((fuel) => fuel === value.fuel) &&
    typeof value.isActive === 'boolean' &&
    [value.fin, value.purchaseDate, value.purchasePrice].every(isNullableString)
  )
}

function isCarPage(value: unknown): value is CarPage {
  return (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.every(isCar) &&
    isNullableString(value.nextCursor)
  )
}

function isSession(value: unknown): value is Session {
  return isRecord(value) && isProfile(value.profile)
}

function isAuthenticationMethods(
  value: unknown,
): value is AuthenticationMethods {
  if (!isRecord(value) || !Array.isArray(value.methods)) return false
  const methods = value.methods
  return (
    methods.length > 0 &&
    methods.includes('magic_link') &&
    new Set(methods).size === methods.length &&
    methods.every((method) => method === 'magic_link' || method === 'oidc')
  )
}

async function jsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    throw new ApiError(
      502,
      'invalid_response',
      'The server response is invalid',
    )
  }
}

export async function getAuthenticationMethods(): Promise<AuthenticationMethods> {
  const response = await fetchApi('/api/v1/auth/methods')
  if (!response.ok) throw await errorFrom(response)
  const body = await jsonBody(response)
  if (!isAuthenticationMethods(body)) {
    throw new ApiError(
      502,
      'invalid_response',
      'The server response is invalid',
    )
  }
  return body
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

  const body = await jsonBody(response)
  if (!isSession(body)) {
    throw new ApiError(
      502,
      'invalid_response',
      'The server response is invalid',
    )
  }
  return body
}

export async function getMe(): Promise<Profile> {
  const response = await fetchApi('/api/v1/me')
  return profileFrom(response)
}

export async function updateMe(input: ProfileUpdate): Promise<Profile> {
  const response = await fetchApi('/api/v1/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return profileFrom(response)
}

function profileFrom(response: Response): Promise<Profile> {
  return decoded(response, isProfile)
}

async function decoded<T>(
  response: Response,
  guard: (value: unknown) => value is T,
): Promise<T> {
  if (response.status === 401) throw new UnauthorizedError()
  if (!response.ok) throw await errorFrom(response)

  const body = await jsonBody(response)
  if (!guard(body)) {
    throw new ApiError(
      502,
      'invalid_response',
      'The server response is invalid',
    )
  }
  return body
}

function carPath(carId: string): string {
  return `/api/v1/cars/${encodeURIComponent(carId)}`
}

export async function getCars(
  options: { cursor?: string | null; limit?: number } = {},
): Promise<CarPage> {
  const query = new URLSearchParams()
  if (options.cursor) query.set('cursor', options.cursor)
  if (options.limit !== undefined) query.set('limit', String(options.limit))
  const search = query.toString()
  return decoded(
    await fetchApi(`/api/v1/cars${search ? `?${search}` : ''}`),
    isCarPage,
  )
}

export async function getCar(carId: string): Promise<Car> {
  return decoded(await fetchApi(carPath(carId)), isCar)
}

export async function createCar(input: CarInput): Promise<Car> {
  const response = await fetchApi('/api/v1/cars', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return decoded(response, isCar)
}

export async function updateCar(carId: string, input: CarUpdate): Promise<Car> {
  const response = await fetchApi(carPath(carId), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return decoded(response, isCar)
}

export async function deleteCar(carId: string): Promise<void> {
  const response = await fetchApi(carPath(carId), { method: 'DELETE' })
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
