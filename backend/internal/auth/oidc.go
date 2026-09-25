package auth

import (
	"context"
	"errors"
	"fmt"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

type VerifiedIdentity struct{ Issuer, Subject, Email string }

type OIDCProvider interface {
	AuthorizationURL(state, nonce, verifier string) string
	Verify(context.Context, string, string, string) (VerifiedIdentity, error)
}

type OIDCClient struct {
	issuer   string
	oauth    oauth2.Config
	verifier *oidc.IDTokenVerifier
}

func NewOIDCClient(ctx context.Context, issuer, clientID, clientSecret, redirectURL string) (*OIDCClient, error) {
	provider, err := oidc.NewProvider(ctx, issuer)
	if err != nil {
		return nil, fmt.Errorf("discover OIDC provider: %w", err)
	}
	return &OIDCClient{issuer: issuer, oauth: oauth2.Config{ClientID: clientID, ClientSecret: clientSecret, Endpoint: provider.Endpoint(), RedirectURL: redirectURL, Scopes: []string{oidc.ScopeOpenID, "email", "profile"}}, verifier: provider.Verifier(&oidc.Config{ClientID: clientID})}, nil
}
func (c *OIDCClient) AuthorizationURL(state, nonce, verifier string) string {
	return c.oauth.AuthCodeURL(state, oauth2.AccessTypeOnline, oauth2.SetAuthURLParam("nonce", nonce), oauth2.S256ChallengeOption(verifier))
}
func (c *OIDCClient) Verify(ctx context.Context, code, verifier, nonce string) (VerifiedIdentity, error) {
	token, err := c.oauth.Exchange(ctx, code, oauth2.VerifierOption(verifier))
	if err != nil {
		return VerifiedIdentity{}, fmt.Errorf("exchange OIDC code: %w", err)
	}
	raw, ok := token.Extra("id_token").(string)
	if !ok {
		return VerifiedIdentity{}, errors.New("OIDC response has no ID token")
	}
	idToken, err := c.verifier.Verify(ctx, raw)
	if err != nil {
		return VerifiedIdentity{}, fmt.Errorf("verify ID token: %w", err)
	}
	var claims struct {
		Email         string `json:"email"`
		EmailVerified bool   `json:"email_verified"`
		Nonce         string `json:"nonce"`
	}
	if err = idToken.Claims(&claims); err != nil {
		return VerifiedIdentity{}, fmt.Errorf("decode ID token claims: %w", err)
	}
	if idToken.Subject == "" {
		return VerifiedIdentity{}, errors.New("OIDC subject is missing")
	}
	if claims.Nonce != nonce {
		return VerifiedIdentity{}, errors.New("invalid OIDC nonce")
	}
	if !claims.EmailVerified || claims.Email == "" {
		return VerifiedIdentity{}, errors.New("OIDC email is not verified")
	}
	return VerifiedIdentity{Issuer: c.issuer, Subject: idToken.Subject, Email: claims.Email}, nil
}
