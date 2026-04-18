package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// RefreshExpDuration is the refresh token TTL. Longer than access token
// because refresh is always paired with blacklist revocation checks.
const RefreshExpDuration = 7 * 24 * time.Hour

const refreshTyp = "refresh"

// RefreshClaims is the payload of a refresh JWT. It intentionally carries
// fewer fields than access Claims — never use it to authorize API calls.
type RefreshClaims struct {
	Sub      string `json:"sub"`
	TenantID string `json:"tenant_id"`
	IAT      int64  `json:"iat"`
	EXP      int64  `json:"exp"`
	JTI      string `json:"jti"`
	Typ      string `json:"typ"` // always "refresh"
}

func (c RefreshClaims) GetExpirationTime() (*jwt.NumericDate, error) {
	return jwt.NewNumericDate(time.Unix(c.EXP, 0)), nil
}
func (c RefreshClaims) GetIssuedAt() (*jwt.NumericDate, error) {
	return jwt.NewNumericDate(time.Unix(c.IAT, 0)), nil
}
func (c RefreshClaims) GetNotBefore() (*jwt.NumericDate, error) { return nil, nil }
func (c RefreshClaims) GetIssuer() (string, error)              { return "", nil }
func (c RefreshClaims) GetSubject() (string, error)             { return c.Sub, nil }
func (c RefreshClaims) GetAudience() (jwt.ClaimStrings, error)  { return nil, nil }

// NewRefreshClaims builds refresh claims with standard TTL and a fresh JTI.
func NewRefreshClaims(sub, tenantID string) RefreshClaims {
	now := time.Now()
	return RefreshClaims{
		Sub:      sub,
		TenantID: tenantID,
		IAT:      now.Unix(),
		EXP:      now.Add(RefreshExpDuration).Unix(),
		JTI:      newJTI(),
		Typ:      refreshTyp,
	}
}

// SignRefresh signs a refresh token with the same keypair as access tokens.
// The distinction is carried in the Typ field — verifiers must assert it.
func (kp *KeyPair) SignRefresh(c RefreshClaims) (string, error) {
	c.Typ = refreshTyp
	tok := jwt.NewWithClaims(jwt.SigningMethodRS256, c)
	signed, err := tok.SignedString(kp.priv)
	if err != nil {
		return "", fmt.Errorf("sign refresh: %w", err)
	}
	return signed, nil
}

// VerifyRefresh parses a refresh token and asserts Typ == "refresh".
func (kp *KeyPair) VerifyRefresh(tokenStr string) (*RefreshClaims, error) {
	var c RefreshClaims
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
	if c.Typ != refreshTyp {
		return nil, fmt.Errorf("%w: not a refresh token", ErrTokenInvalid)
	}
	return &c, nil
}
