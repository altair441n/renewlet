package main

import (
	"fmt"
	"os"
)

const (
	pbEncryptionKeyEnv    = "PB_ENCRYPTION_KEY"
	pbEncryptionKeyLength = 32
)

func validatePBEncryptionKeyEnv() error {
	value := os.Getenv(pbEncryptionKeyEnv)
	if value == "" {
		return nil
	}

	if len(value) != pbEncryptionKeyLength {
		return fmt.Errorf("%s must be exactly %d characters; got %d; generate one with: openssl rand -hex 16", pbEncryptionKeyEnv, pbEncryptionKeyLength, len(value))
	}

	return nil
}
