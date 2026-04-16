// Package auth implements JWT RS256 sign/verify for the API.
package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const ExpDuration = 15 * time.Minute

var (
	ErrTokenExpired   = errors.New("token expired")
	ErrTokenInvalid   = errors.New("token invalid")
	ErrUnexpectedAlg  = errors.New("unexpected signing method")
)

type Claims struct {
	Sub         string   `json:"sub"`
	TenantID    string   `json:"tenant_id"`
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
	IAT         int64    `json:"iat"`
	EXP         int64    `json:"exp"`
	JTI         string   `json:"jti"`
}

// Implement jwt.Claims so golang-jwt/jwt/v5 validates exp for us.

func (c Claims) GetExpirationTime() (*jwt.NumericDate, error) {
	return jwt.NewNumericDate(time.Unix(c.EXP, 0)), nil
}
func (c Claims) GetIssuedAt() (*jwt.NumericDate, error) {
	return jwt.NewNumericDate(time.Unix(c.IAT, 0)), nil
}
func (c Claims) GetNotBefore() (*jwt.NumericDate, error) { return nil, nil }
func (c Claims) GetIssuer() (string, error)               { return "", nil }
func (c Claims) GetSubject() (string, error)              { return c.Sub, nil }
func (c Claims) GetAudience() (jwt.ClaimStrings, error)   { return nil, nil }

// NewClaims builds a Claims with IAT=now, EXP=now+ExpDuration, and a fresh JTI.
func NewClaims(sub, tenantID string, roles, perms []string) Claims {
	now := time.Now()
	return Claims{
		Sub:         sub,
		TenantID:    tenantID,
		Roles:       roles,
		Permissions: perms,
		IAT:         now.Unix(),
		EXP:         now.Add(ExpDuration).Unix(),
		JTI:         newJTI(),
	}
}

func newJTI() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}

type KeyPair struct {
	priv *rsa.PrivateKey
	pub  *rsa.PublicKey
}

// LoadKeyPair parses PEM-encoded RS256 keys. Expects PKCS#8 private + PKIX public.
func LoadKeyPair(privPEM, pubPEM string) (*KeyPair, error) {
	priv, err := jwt.ParseRSAPrivateKeyFromPEM([]byte(privPEM))
	if err != nil {
		return nil, fmt.Errorf("parse private key: %w", err)
	}
	pub, err := jwt.ParseRSAPublicKeyFromPEM([]byte(pubPEM))
	if err != nil {
		return nil, fmt.Errorf("parse public key: %w", err)
	}
	return &KeyPair{priv: priv, pub: pub}, nil
}

func (kp *KeyPair) Sign(c Claims) (string, error) {
	tok := jwt.NewWithClaims(jwt.SigningMethodRS256, c)
	signed, err := tok.SignedString(kp.priv)
	if err != nil {
		return "", fmt.Errorf("sign: %w", err)
	}
	return signed, nil
}

func (kp *KeyPair) Verify(tokenStr string) (*Claims, error) {
	var c Claims
	_, err := jwt.ParseWithClaims(
		tokenStr,
		&c,
		func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
				return nil, ErrUnexpectedAlg
			}
			return kp.pub, nil
		},
		jwt.WithValidMethods([]string{"RS256"}),
	)
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, fmt.Errorf("%w: %v", ErrTokenInvalid, err)
	}
	return &c, nil
}
