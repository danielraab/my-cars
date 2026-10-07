import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  base64urlToBuffer,
  bufferToBase64url,
  createPasskeyCredential,
  creationOptionsFromJSON,
  getPasskeyCredential,
  PasskeyCancelledError,
  passkeysSupported,
  requestOptionsFromJSON,
} from './passkeys'

const bytes = (...values: number[]) => new Uint8Array(values).buffer

afterEach(() => vi.unstubAllGlobals())

function stubCredentials(credentials: Partial<CredentialsContainer>) {
  vi.stubGlobal('PublicKeyCredential', function PublicKeyCredential() {})
  vi.stubGlobal('navigator', { ...navigator, credentials })
}

describe('base64url conversion', () => {
  it.each([
    [[], ''],
    [[0], 'AA'],
    [[251, 255], '-_8'],
    [[1, 2, 3, 4, 5], 'AQIDBAU'],
  ])('round-trips %j', (values, encoded) => {
    expect(bufferToBase64url(bytes(...values))).toBe(encoded)
    expect([...new Uint8Array(base64urlToBuffer(encoded))]).toEqual(values)
  })

  it('encodes typed-array views by their own bytes', () => {
    const view = new Uint8Array([9, 1, 2, 9]).subarray(1, 3)
    expect(bufferToBase64url(view)).toBe('AQI')
  })
})

describe('option conversion', () => {
  it('decodes binary members of creation options', () => {
    const options = creationOptionsFromJSON({
      publicKey: {
        challenge: 'AQID',
        rp: { id: 'cars.example', name: 'my-car' },
        user: { id: 'BAU', name: 'driver@example.com', displayName: 'Ada' },
        excludeCredentials: [{ type: 'public-key', id: 'Bgc' }],
      },
    })
    expect([...new Uint8Array(options.challenge as ArrayBuffer)]).toEqual([
      1, 2, 3,
    ])
    expect([...new Uint8Array(options.user.id as ArrayBuffer)]).toEqual([4, 5])
    expect(options.user.name).toBe('driver@example.com')
    const excluded = options.excludeCredentials?.[0]
    expect([...new Uint8Array(excluded?.id as ArrayBuffer)]).toEqual([6, 7])
  })

  it('decodes request options without inventing an allow list', () => {
    const options = requestOptionsFromJSON({
      publicKey: { challenge: 'AQID', userVerification: 'required' },
    })
    expect([...new Uint8Array(options.challenge as ArrayBuffer)]).toEqual([
      1, 2, 3,
    ])
    expect(options.userVerification).toBe('required')
    expect(options).not.toHaveProperty('allowCredentials')
  })
})

describe('browser prompts', () => {
  it('reports missing WebAuthn support', () => {
    vi.stubGlobal('PublicKeyCredential', undefined)
    expect(passkeysSupported()).toBe(false)
    stubCredentials({ create: vi.fn(), get: vi.fn() })
    expect(passkeysSupported()).toBe(true)
  })

  it('serializes a created credential', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'AQI',
      rawId: bytes(1, 2),
      type: 'public-key',
      authenticatorAttachment: 'platform',
      getClientExtensionResults: () => ({ credProps: { rk: true } }),
      response: {
        clientDataJSON: bytes(3),
        attestationObject: bytes(4),
        getTransports: () => ['internal'],
      },
    })
    stubCredentials({ create })
    const json = await createPasskeyCredential({
      publicKey: { challenge: 'AQID', user: { id: 'BAU' } },
    })
    expect(json).toEqual({
      id: 'AQI',
      rawId: 'AQI',
      type: 'public-key',
      authenticatorAttachment: 'platform',
      clientExtensionResults: { credProps: { rk: true } },
      response: {
        clientDataJSON: 'Aw',
        attestationObject: 'BA',
        transports: ['internal'],
      },
    })
  })

  it('serializes an assertion including the user handle', async () => {
    const get = vi.fn().mockResolvedValue({
      id: 'AQI',
      rawId: bytes(1, 2),
      type: 'public-key',
      getClientExtensionResults: () => ({}),
      response: {
        clientDataJSON: bytes(3),
        authenticatorData: bytes(4),
        signature: bytes(5),
        userHandle: bytes(6),
      },
    })
    stubCredentials({ get })
    const json = await getPasskeyCredential({
      publicKey: { challenge: 'AQID' },
    })
    expect(json.response).toEqual({
      clientDataJSON: 'Aw',
      authenticatorData: 'BA',
      signature: 'BQ',
      userHandle: 'Bg',
    })
  })

  it.each(['NotAllowedError', 'AbortError'])(
    'maps %s to a cancellation',
    async (name) => {
      stubCredentials({
        get: vi.fn().mockRejectedValue(new DOMException('no', name)),
      })
      await expect(
        getPasskeyCredential({ publicKey: { challenge: 'AQID' } }),
      ).rejects.toBeInstanceOf(PasskeyCancelledError)
    },
  )

  it('passes other browser errors through', async () => {
    const failure = new DOMException('bad', 'SecurityError')
    stubCredentials({ create: vi.fn().mockRejectedValue(failure) })
    await expect(
      createPasskeyCredential({
        publicKey: { challenge: 'AQID', user: { id: 'BAU' } },
      }),
    ).rejects.toBe(failure)
  })
})
