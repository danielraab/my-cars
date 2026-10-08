CREATE TABLE webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id BYTEA NOT NULL UNIQUE CHECK (octet_length(credential_id) BETWEEN 1 AND 1023),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    public_key BYTEA NOT NULL CHECK (octet_length(public_key) > 0),
    sign_count BIGINT NOT NULL DEFAULT 0 CHECK (sign_count >= 0),
    aaguid BYTEA CHECK (aaguid IS NULL OR octet_length(aaguid) = 16),
    transports TEXT[] NOT NULL DEFAULT '{}',
    attestation_format TEXT NOT NULL DEFAULT 'none',
    user_verified BOOLEAN NOT NULL,
    backup_eligible BOOLEAN NOT NULL,
    backup_state BOOLEAN NOT NULL CHECK (backup_eligible OR NOT backup_state),
    name TEXT NOT NULL CHECK (btrim(name) <> '' AND char_length(name) <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ
);

CREATE INDEX webauthn_credentials_account_created_at_id_idx ON webauthn_credentials (account_id, created_at, id);

CREATE TABLE webauthn_challenges (
    ceremony_digest BYTEA PRIMARY KEY CHECK (octet_length(ceremony_digest) = 32),
    kind TEXT NOT NULL CHECK (kind IN ('registration', 'login')),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    session_data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((kind = 'registration') = (account_id IS NOT NULL))
);

CREATE INDEX webauthn_challenges_expiry_idx ON webauthn_challenges (expires_at);

ALTER TABLE sessions
    ADD COLUMN credential_id UUID REFERENCES webauthn_credentials(id) ON DELETE SET NULL;

CREATE INDEX sessions_credential_idx ON sessions (credential_id) WHERE credential_id IS NOT NULL;
