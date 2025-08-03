//go:build linux
// +build linux

package config

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

func init() {
	home, err := os.UserHomeDir()
	if err != nil {
		log.Println("[-] No se pudo obtener directorio home:", err)
		return
	}

	configDir := filepath.Join(home, ".config", "tu_aplicacion")
	configFile := filepath.Join(configDir, "uuid")

	// Intentar leer el UUID desde el archivo
	data, err := os.ReadFile(configFile)
	if err == nil {
		UUID = strings.TrimSpace(string(data))
		if UUID != "" {
			return
		}
	}

	// Crear un nuevo UUID si no existe
	UUID = uuid.New().String()

	// Crear directorio si no existe
	if err := os.MkdirAll(configDir, 0700); err != nil {
		log.Println("[-] No se pudo crear el directorio de configuración:", err)
		return
	}

	// Guardar el UUID en el archivo
	if err := os.WriteFile(configFile, []byte(UUID), 0600); err != nil {
		log.Println("[-] No se pudo guardar UUID en archivo:", err)
	}
}
