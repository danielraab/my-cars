// Bridges the backend's WebAuthn JSON (binary members base64url-encoded) and
// the browser's navigator.credentials API, which works with ArrayBuffers.

type JsonObject = Record<string, unknown>

export type PasskeyCreationOptionsJSON = { publicKey: JsonObject }
export type PasskeyRequestOptionsJSON = { publicKey: JsonObject }
export type PublicKeyCredentialJSON = {
  id: string
  rawId: string
  type: 'public-key'
  response: JsonObject
  clientExtensionResults: JsonObject
  authenticatorAttachment?: string | null
}

/** The user dismissed or timed out the browser's passkey prompt. */
export class PasskeyCancelledError extends Error {
  constructor() {
    super('The passkey prompt was cancelled')
    this.name = 'PasskeyCancelledError'
  }
}

export function passkeysSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential === 'function' &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function'
  )
}

export function base64urlToBuffer(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes.buffer
}

export function bufferToBase64url(
  buffer: ArrayBuffer | ArrayBufferView,
): string {
  const bytes =
    buffer instanceof ArrayBuffer
      ? new Uint8Array(buffer)
      : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function descriptors(value: unknown): PublicKeyCredentialDescriptor[] {
  if (!Array.isArray(value)) return []
  return value.map((descriptor: JsonObject) => ({
    ...descriptor,
    type: 'public-key',
    id: base64urlToBuffer(String(descriptor.id)),
  })) as PublicKeyCredentialDescriptor[]
}

export function creationOptionsFromJSON(
  options: PasskeyCreationOptionsJSON,
): PublicKeyCredentialCreationOptions {
  const publicKey = options.publicKey
  const user = publicKey.user as JsonObject
  return {
    ...publicKey,
    challenge: base64urlToBuffer(String(publicKey.challenge)),
    user: { ...user, id: base64urlToBuffer(String(user.id)) },
    excludeCredentials: descriptors(publicKey.excludeCredentials),
  } as PublicKeyCredentialCreationOptions
}

export function requestOptionsFromJSON(
  options: PasskeyRequestOptionsJSON,
): PublicKeyCredentialRequestOptions {
  const publicKey = options.publicKey
  const converted: JsonObject = {
    ...publicKey,
    challenge: base64urlToBuffer(String(publicKey.challenge)),
  }
  if (publicKey.allowCredentials !== undefined) {
    converted.allowCredentials = descriptors(publicKey.allowCredentials)
  }
  return converted as unknown as PublicKeyCredentialRequestOptions
}

function credentialBase(credential: PublicKeyCredential) {
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: 'public-key' as const,
    clientExtensionResults: (credential.getClientExtensionResults?.() ??
      {}) as JsonObject,
    authenticatorAttachment: credential.authenticatorAttachment ?? null,
  }
}

export function registrationToJSON(
  credential: PublicKeyCredential,
): PublicKeyCredentialJSON {
  const response = credential.response as AuthenticatorAttestationResponse
  return {
    ...credentialBase(credential),
    response: {
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      attestationObject: bufferToBase64url(response.attestationObject),
      transports: response.getTransports?.() ?? [],
    },
  }
}

export function assertionToJSON(
  credential: PublicKeyCredential,
): PublicKeyCredentialJSON {
  const response = credential.response as AuthenticatorAssertionResponse
  return {
    ...credentialBase(credential),
    response: {
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      authenticatorData: bufferToBase64url(response.authenticatorData),
      signature: bufferToBase64url(response.signature),
      userHandle: response.userHandle
        ? bufferToBase64url(response.userHandle)
        : null,
    },
  }
}

function isCancellation(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'NotAllowedError' || error.name === 'AbortError')
  )
}

async function prompt(
  request: () => Promise<Credential | null>,
): Promise<PublicKeyCredential> {
  let credential: Credential | null
  try {
    credential = await request()
  } catch (error) {
    if (isCancellation(error)) throw new PasskeyCancelledError()
    throw error
  }
  if (!credential) throw new PasskeyCancelledError()
  return credential as PublicKeyCredential
}

/** Shows the browser prompt to create a passkey for the given options. */
export async function createPasskeyCredential(
  options: PasskeyCreationOptionsJSON,
): Promise<PublicKeyCredentialJSON> {
  const credential = await prompt(() =>
    navigator.credentials.create({
      publicKey: creationOptionsFromJSON(options),
    }),
  )
  return registrationToJSON(credential)
}

/** Shows the browser prompt to sign in with a passkey. */
export async function getPasskeyCredential(
  options: PasskeyRequestOptionsJSON,
): Promise<PublicKeyCredentialJSON> {
  const credential = await prompt(() =>
    navigator.credentials.get({ publicKey: requestOptionsFromJSON(options) }),
  )
  return assertionToJSON(credential)
}
