//go:build !windows
// +build !windows

package report

import (
	"os"
)

// Implementación para sistemas Unix
func GetDNSFromRegistry() []string {
	// En Unix no hay registro, devolver slice vacío
	return []string{}
}

func GetWindowsPersistencePoints() []string {
	// En Unix no hay registro de Windows, devolver slice vacío
	return []string{}
}

func isElevatedUser() bool {
	// En Unix, verificar si somos root
	return os.Geteuid() == 0
}
