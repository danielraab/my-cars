import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ApiError,
  completePasskeyLogin,
  deletePasskey,
  getPasskeys,
  registerPasskey,
  renamePasskey,
  startPasskeyLogin,
  startPasskeyRegistration,
  UnauthorizedError,
} from './client'

const passkey = {
  id: '3f2b8f0e-1a7c-4c55-9d43-0f6f3c7b9a11',
  name: 'Laptop',
  createdAt: '2026-10-01T10:00:00Z',
  lastUsedAt: null,
  authenticatorName: 'Google Password Manager',
  backedUp: true,
}
const credential = {
  id: 'abc',
  rawId: 'abc',
  type: 'public-key' as const,
  response: {},
  clientExtensionResults: {},
}

function respond(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('passkey API client', () => {
  it('lists, registers, and renames passkeys', async () => {
    let fetchMock = respond(200, { items: [passkey] })
    await expect(getPasskeys()).resolves.toEqual([passkey])
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/passkeys',
      expect.objectContaining({ credentials: 'same-origin' }),
    )

    fetchMock = respond(201, passkey)
    await expect(
      registerPasskey({ name: 'Laptop', credential }),
    ).resolves.toEqual(passkey)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ name: 'Laptop', credential }),
    })

    fetchMock = respond(200, { ...passkey, name: 'Work' })
    await expect(renamePasskey(passkey.id, 'Work')).resolves.toMatchObject({
      name: 'Work',
    })
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/v1/passkeys/${passkey.id}`)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'PATCH' })
  })

  it('rejects malformed passkey lists', async () => {
    respond(200, { items: [{ ...passkey, backedUp: 'yes' }] })
    await expect(getPasskeys()).rejects.toMatchObject({
      code: 'invalid_response',
    })
  })

  it('reports reauthentication-required registration starts', async () => {
    respond(403, {
      code: 'reauthentication_required',
      message: 'login again',
    })
    const error = await startPasskeyRegistration().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 403,
      code: 'reauthentication_required',
    })
  })

  it('returns WebAuthn options for registration and login', async () => {
    const options = { publicKey: { challenge: 'Y2hhbGxlbmdl' } }
    respond(200, options)
    await expect(startPasskeyRegistration()).resolves.toEqual(options)
    respond(200, options)
    await expect(startPasskeyLogin()).resolves.toEqual(options)
    respond(200, { publicKey: {} })
    await expect(startPasskeyLogin()).rejects.toMatchObject({
      code: 'invalid_response',
    })
  })

  it('completes and rejects passkey logins', async () => {
    respond(204)
    await expect(completePasskeyLogin(credential)).resolves.toBeUndefined()
    respond(401, { code: 'unauthorized', message: 'no' })
    await expect(completePasskeyLogin(credential)).rejects.toMatchObject({
      status: 401,
    })
  })

  it('deletes passkeys and maps a revoked session to UnauthorizedError', async () => {
    respond(204)
    await expect(deletePasskey(passkey.id)).resolves.toBeUndefined()
    respond(401)
    await expect(deletePasskey(passkey.id)).rejects.toBeInstanceOf(
      UnauthorizedError,
    )
    respond(404, { code: 'not_found', message: 'gone' })
    await expect(deletePasskey(passkey.id)).rejects.toMatchObject({
      status: 404,
    })
  })
})
