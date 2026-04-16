package blacklist

import (
	"context"
	"testing"
	"time"
)

func TestMemory_ContainsAfterAdd(t *testing.T) {
	m := NewMemory()
	exp := time.Now().Add(1 * time.Hour)
	if err := m.Add(context.Background(), "jti-1", exp); err != nil {
		t.Fatal(err)
	}
	ok, err := m.Contains(context.Background(), "jti-1")
	if err != nil || !ok {
		t.Errorf("expected Contains true, got %v, err=%v", ok, err)
	}
}

func TestMemory_NotContainsUnknown(t *testing.T) {
	m := NewMemory()
	ok, err := m.Contains(context.Background(), "jti-nope")
	if err != nil || ok {
		t.Errorf("expected Contains false, got %v, err=%v", ok, err)
	}
}

func TestMemory_ExpiredEntryEvictsOnRead(t *testing.T) {
	m := NewMemory()
	// Expired 1s ago.
	_ = m.Add(context.Background(), "jti-expired", time.Now().Add(-1*time.Second))
	ok, _ := m.Contains(context.Background(), "jti-expired")
	if ok {
		t.Error("expired entry still reported contained")
	}
}
