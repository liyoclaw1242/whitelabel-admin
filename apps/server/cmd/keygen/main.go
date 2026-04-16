// Command keygen produces an RS256 keypair (PEM) and writes both to stdout.
// Usage: go run ./cmd/keygen
package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
)

func main() {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		fmt.Fprintln(os.Stderr, "generate:", err)
		os.Exit(1)
	}

	privDER, err := x509.MarshalPKCS8PrivateKey(key)
	if err != nil {
		fmt.Fprintln(os.Stderr, "marshal private:", err)
		os.Exit(1)
	}
	pubDER, err := x509.MarshalPKIXPublicKey(&key.PublicKey)
	if err != nil {
		fmt.Fprintln(os.Stderr, "marshal public:", err)
		os.Exit(1)
	}

	if err := pem.Encode(os.Stdout, &pem.Block{Type: "PRIVATE KEY", Bytes: privDER}); err != nil {
		fmt.Fprintln(os.Stderr, "encode private:", err)
		os.Exit(1)
	}
	if err := pem.Encode(os.Stdout, &pem.Block{Type: "PUBLIC KEY", Bytes: pubDER}); err != nil {
		fmt.Fprintln(os.Stderr, "encode public:", err)
		os.Exit(1)
	}
}
