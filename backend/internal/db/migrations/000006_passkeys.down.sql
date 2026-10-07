DROP INDEX sessions_credential_idx;
ALTER TABLE sessions
    DROP COLUMN credential_id;
DROP TABLE webauthn_challenges;
DROP TABLE webauthn_credentials;
