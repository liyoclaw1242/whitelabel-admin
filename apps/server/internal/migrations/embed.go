// Package migrations provides the embedded SQL migration files for
// golang-migrate. Usage:
//
//	source, _ := iofs.New(migrations.FS, ".")
//	m, _ := migrate.NewWithSourceInstance("iofs", source, databaseURL)
//	m.Up()
package migrations

import "embed"

//go:embed ../../migrations/*.sql
var FS embed.FS
