ALTER TABLE magic_link_challenges
    ADD COLUMN return_to TEXT NOT NULL DEFAULT '/';

ALTER TABLE oidc_login_attempts
    ADD CONSTRAINT oidc_login_attempts_state_digest_length CHECK (octet_length(state_digest) = 32),
    ADD CONSTRAINT oidc_login_attempts_return_to_local CHECK (left(return_to, 1) = '/' AND left(return_to, 2) <> '//');
ALTER TABLE magic_link_challenges
    ADD CONSTRAINT magic_link_challenges_token_digest_length CHECK (octet_length(token_digest) = 32),
    ADD CONSTRAINT magic_link_challenges_return_to_local CHECK (left(return_to, 1) = '/' AND left(return_to, 2) <> '//');
ALTER TABLE sessions
    ADD CONSTRAINT sessions_token_digest_length CHECK (octet_length(token_digest) = 32);
