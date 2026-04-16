package memory

import (
	"context"
	"errors"
	"testing"

	"golang.org/x/crypto/bcrypt"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/repo"
)

func TestUserRepo_Seeded(t *testing.T) {
	r, err := NewUserRepo()
	if err != nil {
		t.Fatal(err)
	}
	for _, email := range []string{"admin@test", "editor@test", "viewer@test"} {
		u, err := r.FindByEmail(context.Background(), email)
		if err != nil {
			t.Errorf("FindByEmail(%q): %v", email, err)
			continue
		}
		if err := bcrypt.CompareHashAndPassword(u.PasswordHash, []byte("password")); err != nil {
			t.Errorf("%s password doesn't verify: %v", email, err)
		}
	}
}

func TestUserRepo_FindByEmail_CaseInsensitive(t *testing.T) {
	r, _ := NewUserRepo()
	if _, err := r.FindByEmail(context.Background(), "ADMIN@TEST"); err != nil {
		t.Errorf("case-insensitive lookup failed: %v", err)
	}
}

func TestUserRepo_FindByID(t *testing.T) {
	r, _ := NewUserRepo()
	u, err := r.FindByID(context.Background(), "user-admin")
	if err != nil || u.Email != "admin@test" {
		t.Errorf("u=%+v err=%v", u, err)
	}
}

func TestUserRepo_NotFound(t *testing.T) {
	r, _ := NewUserRepo()
	_, err := r.FindByEmail(context.Background(), "missing@test")
	if !errors.Is(err, repo.ErrNotFound) {
		t.Errorf("err = %v, want ErrNotFound", err)
	}
}

func TestUserRepo_CreateThenFind(t *testing.T) {
	r, _ := NewUserRepo()
	newUser := &repo.User{
		ID: "user-new", Email: "new@test", Name: "New",
		PasswordHash: []byte("x"), TenantID: "tenant-1",
	}
	if err := r.Create(context.Background(), newUser); err != nil {
		t.Fatal(err)
	}
	u, err := r.FindByEmail(context.Background(), "new@test")
	if err != nil || u.ID != "user-new" {
		t.Errorf("u=%+v err=%v", u, err)
	}
}

func TestUserRepo_ConcurrentSafe(t *testing.T) {
	r, _ := NewUserRepo()
	done := make(chan struct{})
	// reader
	go func() {
		for i := 0; i < 1000; i++ {
			_, _ = r.FindByEmail(context.Background(), "admin@test")
		}
		done <- struct{}{}
	}()
	// writer
	go func() {
		for i := 0; i < 100; i++ {
			u := &repo.User{ID: "x", Email: "x@t", TenantID: "tenant-1"}
			_ = r.Create(context.Background(), u)
		}
		done <- struct{}{}
	}()
	<-done
	<-done
}
