CREATE TABLE oidc_identities (
    issuer TEXT NOT NULL CHECK (btrim(issuer) <> ''),
    subject TEXT NOT NULL CHECK (btrim(subject) <> ''),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (issuer, subject)
);

CREATE TABLE oidc_login_attempts (
    state_digest BYTEA PRIMARY KEY,
    nonce TEXT NOT NULL CHECK (btrim(nonce) <> ''),
    pkce_verifier TEXT NOT NULL CHECK (btrim(pkce_verifier) <> ''),
    return_to TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE magic_link_challenges (
    token_digest BYTEA PRIMARY KEY,
    email TEXT NOT NULL CHECK (email = lower(email) AND email = btrim(email) AND email <> ''),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    token_digest BYTEA PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX oidc_login_attempts_expiry_idx ON oidc_login_attempts (expires_at);
CREATE INDEX magic_link_challenges_expiry_idx ON magic_link_challenges (expires_at);
CREATE INDEX sessions_account_expiry_idx ON sessions (account_id, expires_at);
CREATE INDEX sessions_expiry_idx ON sessions (expires_at);
