package store

import (
	"context"
	"errors"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestMemoryUserRepo_Seeded(t *testing.T) {
	m, err := NewMemoryUserRepo()
	if err != nil {
		t.Fatalf("NewMemoryUserRepo: %v", err)
	}
	for _, email := range []string{"admin@test", "editor@test", "viewer@test"} {
		u, err := m.FindByEmail(context.Background(), email)
		if err != nil {
			t.Errorf("FindByEmail(%q): %v", email, err)
			continue
		}
		if err := bcrypt.CompareHashAndPassword(u.PasswordHash, []byte("password")); err != nil {
			t.Errorf("%s: password 'password' does not verify: %v", email, err)
		}
	}
}

func TestMemoryUserRepo_UnknownEmail(t *testing.T) {
	m, _ := NewMemoryUserRepo()
	_, err := m.FindByEmail(context.Background(), "nobody@test")
	if !errors.Is(err, ErrUserNotFound) {
		t.Errorf("err = %v, want ErrUserNotFound", err)
	}
}

func TestMemoryUserRepo_EmailCaseInsensitive(t *testing.T) {
	m, _ := NewMemoryUserRepo()
	if _, err := m.FindByEmail(context.Background(), "ADMIN@test"); err != nil {
		t.Errorf("expected case-insensitive lookup, got %v", err)
	}
}

func TestMemoryUserRepo_FindByID(t *testing.T) {
	m, _ := NewMemoryUserRepo()
	u, err := m.FindByID(context.Background(), "user-admin")
	if err != nil || u.Email != "admin@test" {
		t.Errorf("FindByID: u=%+v err=%v", u, err)
	}
}
