package auth

import (
	"testing"
	"time"
)

func TestRefresh_SignVerifyRoundTrip(t *testing.T) {
	priv, pub := makePEMs(t)
	kp, _ := LoadKeyPair(priv, pub)

	c := NewRefreshClaims("user-1", "tenant-1")
	tok, err := kp.SignRefresh(c)
	if err != nil {
		t.Fatalf("SignRefresh: %v", err)
	}
	got, err := kp.VerifyRefresh(tok)
	if err != nil {
		t.Fatalf("VerifyRefresh: %v", err)
	}
	if got.Sub != "user-1" || got.TenantID != "tenant-1" || got.Typ != "refresh" || got.JTI == "" {
		t.Errorf("claims round-trip: %+v", got)
	}
}

func TestRefresh_RejectsAccessTokenAsRefresh(t *testing.T) {
	priv, pub := makePEMs(t)
	kp, _ := LoadKeyPair(priv, pub)

	c := NewClaims("user-1", "tenant-1", []string{"admin"}, nil)
	tok, _ := kp.Sign(c)

	if _, err := kp.VerifyRefresh(tok); err == nil {
		t.Error("expected VerifyRefresh to reject an access token (no typ='refresh')")
	}
}

func TestRefresh_Expired(t *testing.T) {
	priv, pub := makePEMs(t)
	kp, _ := LoadKeyPair(priv, pub)

	c := NewRefreshClaims("u", "t")
	c.IAT = time.Now().Add(-10 * 24 * time.Hour).Unix()
	c.EXP = time.Now().Add(-1 * time.Hour).Unix()

	tok, _ := kp.SignRefresh(c)
	_, err := kp.VerifyRefresh(tok)
	if err == nil {
		t.Error("expected expired error")
	}
}
