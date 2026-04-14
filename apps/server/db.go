package main

import (
	"database/sql"
	"fmt"
)

// tursoConn wraps *sql.DB and implements the pinger interface.
type tursoConn struct {
	db *sql.DB
}

func openDB(dbURL, authToken string) (*tursoConn, error) {
	dsn := dbURL
	if authToken != "" {
		dsn = fmt.Sprintf("%s?authToken=%s", dbURL, authToken)
	}

	db, err := sql.Open("libsql", dsn)
	if err != nil {
		return nil, fmt.Errorf("sql.Open: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("db.Ping: %w", err)
	}

	return &tursoConn{db: db}, nil
}

func (t *tursoConn) Ping() error {
	return t.db.Ping()
}

func (t *tursoConn) Close() error {
	return t.db.Close()
}
