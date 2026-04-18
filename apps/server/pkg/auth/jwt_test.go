package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"testing"
	"time"
)

func makePEMs(t *testing.T) (priv string, pub string) {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("keygen: %v", err)
	}
	privDER, err := x509.MarshalPKCS8PrivateKey(key)
	if err != nil {
		t.Fatalf("marshal priv: %v", err)
	}
	pubDER, err := x509.MarshalPKIXPublicKey(&key.PublicKey)
	if err != nil {
		t.Fatalf("marshal pub: %v", err)
	}
	privPEM := string(pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: privDER}))
	pubPEM := string(pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: pubDER}))
	return privPEM, pubPEM
}

func newClaims() Claims {
	now := time.Now().Unix()
	return Claims{
		Sub:         "user-123",
		TenantID:    "tenant-abc",
		Roles:       []string{"admin"},
		Permissions: []string{"users:read"},
		IAT:         now,
		EXP:         now + 60,
		JTI:         "jti-1",
	}
}

func TestSignAndVerify_RoundTrip(t *testing.T) {
	priv, pub := makePEMs(t)
	kp, err := LoadKeyPair(priv, pub)
	if err != nil {
		t.Fatalf("LoadKeyPair: %v", err)
	}

	tok, err := kp.Sign(newClaims())
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}

	got, err := kp.Verify(tok)
	if err != nil {
		t.Fatalf("Verify: %v", err)
	}
	if got.Sub != "user-123" || got.TenantID != "tenant-abc" {
		t.Errorf("claims round-trip lost data: %+v", got)
	}
	if len(got.Roles) != 1 || got.Roles[0] != "admin" {
		t.Errorf("roles lost: %v", got.Roles)
	}
	if got.JTI != "jti-1" {
		t.Errorf("jti lost: %q", got.JTI)
	}
}

func TestVerify_ExpiredToken(t *testing.T) {
	priv, pub := makePEMs(t)
	kp, _ := LoadKeyPair(priv, pub)

	c := newClaims()
	c.IAT = time.Now().Add(-2 * time.Hour).Unix()
	c.EXP = time.Now().Add(-1 * time.Hour).Unix()

	tok, err := kp.Sign(c)
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}
	if _, err := kp.Verify(tok); !errors.Is(err, ErrTokenExpired) {
		t.Errorf("expected ErrTokenExpired, got %v", err)
	}
}

func TestVerify_WrongSignature(t *testing.T) {
	priv1, _ := makePEMs(t)
	_, pub2 := makePEMs(t) // different key
	kp1, _ := LoadKeyPair(priv1, pub2)

	tok, err := kp1.Sign(newClaims())
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}
	if _, err := kp1.Verify(tok); err == nil {
		t.Error("expected verify error with mismatched keys, got nil")
	}
}

func TestVerify_Malformed(t *testing.T) {
	priv, pub := makePEMs(t)
	kp, _ := LoadKeyPair(priv, pub)

	if _, err := kp.Verify("not-a-jwt"); err == nil {
		t.Error("expected malformed error, got nil")
	}
}

func TestLoadKeyPair_InvalidPEM(t *testing.T) {
	if _, err := LoadKeyPair("not-a-pem", "not-a-pem"); err == nil {
		t.Error("expected error for invalid PEM")
	}
}

func TestLoadKeyPair_OnlyPrivateInvalid(t *testing.T) {
	_, pub := makePEMs(t)
	if _, err := LoadKeyPair("not-a-pem", pub); err == nil {
		t.Error("expected error for invalid private PEM")
	}
}

func TestClaims_JWTInterfaceAccessors(t *testing.T) {
	c := newClaims()
	if sub, _ := c.GetSubject(); sub != c.Sub {
		t.Errorf("GetSubject = %q, want %q", sub, c.Sub)
	}
	if iat, _ := c.GetIssuedAt(); iat == nil || iat.Unix() != c.IAT {
		t.Errorf("GetIssuedAt = %v, want %d", iat, c.IAT)
	}
	if iss, _ := c.GetIssuer(); iss != "" {
		t.Errorf("GetIssuer = %q, want empty", iss)
	}
	if aud, _ := c.GetAudience(); aud != nil {
		t.Errorf("GetAudience = %v, want nil", aud)
	}
}

func TestNewClaims_FillsIATAndEXP(t *testing.T) {
	c := NewClaims("sub", "tenant", []string{"admin"}, nil)
	if c.IAT == 0 {
		t.Error("IAT not set")
	}
	if c.EXP <= c.IAT {
		t.Errorf("EXP %d not after IAT %d", c.EXP, c.IAT)
	}
	if c.EXP-c.IAT != int64(ExpDuration.Seconds()) {
		t.Errorf("TTL = %d, want %d", c.EXP-c.IAT, int64(ExpDuration.Seconds()))
	}
	if c.JTI == "" {
		t.Error("JTI not set")
	}
}
