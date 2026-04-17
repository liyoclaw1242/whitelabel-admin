// Command migrate runs database migrations against the Neon Postgres
// instance specified by DATABASE_URL.
//
// Usage:
//
//	go run ./cmd/migrate up
//	go run ./cmd/migrate down
//	go run ./cmd/migrate version
//	go run ./cmd/migrate force VERSION
package main

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"

	migrations "github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/migrations"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL env required")
	}

	source, err := iofs.New(migrations.FS, "migrations")
	if err != nil {
		log.Fatalf("iofs: %v", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", source, dsn)
	if err != nil {
		log.Fatalf("migrate.New: %v", err)
	}
	defer m.Close()

	if len(os.Args) < 2 {
		log.Fatal("usage: migrate <up|down|version|force VERSION>")
	}

	switch os.Args[1] {
	case "up":
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			log.Fatalf("up: %v", err)
		}
		fmt.Println("migrations applied")
	case "down":
		if err := m.Down(); err != nil && err != migrate.ErrNoChange {
			log.Fatalf("down: %v", err)
		}
		fmt.Println("all migrations rolled back")
	case "version":
		v, dirty, err := m.Version()
		if err != nil {
			log.Fatalf("version: %v", err)
		}
		fmt.Printf("version: %d, dirty: %v\n", v, dirty)
	case "force":
		if len(os.Args) < 3 {
			log.Fatal("force requires VERSION argument")
		}
		ver, err := strconv.Atoi(os.Args[2])
		if err != nil {
			log.Fatalf("invalid version: %v", err)
		}
		if err := m.Force(ver); err != nil {
			log.Fatalf("force: %v", err)
		}
		fmt.Printf("forced to version %d\n", ver)
	default:
		log.Fatalf("unknown command: %s", os.Args[1])
	}
}
