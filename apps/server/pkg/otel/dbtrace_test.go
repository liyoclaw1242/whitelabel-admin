package otel

import "testing"

func TestSanitize_ReplacesLiterals(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"SELECT * FROM users WHERE id = 42", "SELECT * FROM users WHERE id = ?"},
		{"SELECT * FROM users WHERE email = 'alice@example.com'", "SELECT * FROM users WHERE email = ?"},
		{"UPDATE t SET n = 123 WHERE id = 456", "UPDATE t SET n = ? WHERE id = ?"},
		{"SELECT 1", "SELECT ?"},
	}
	for _, tc := range cases {
		if got := Sanitize(tc.in); got != tc.want {
			t.Errorf("Sanitize(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}
