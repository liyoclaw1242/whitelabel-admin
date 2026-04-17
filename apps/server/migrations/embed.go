// Package migrations provides the embedded SQL migration files for
// golang-migrate via go:embed.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
