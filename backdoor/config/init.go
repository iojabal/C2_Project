//go:build windows
// +build windows

package config

import (
	"log"

	"github.com/google/uuid"
	"golang.org/x/sys/windows/registry"
)

func init() {
	k, err := registry.OpenKey(registry.CURRENT_USER, RegKeyPath, registry.READ)
	if err == nil {
		defer k.Close()
		u, _, err := k.GetStringValue(RegValue)
		if err == nil && u != "" {
			UUID = u
			return
		}
	}

	// Si no existe el UUID o hubo error, generamos uno nuevo y lo guardamos
	UUID = uuid.New().String()
	k, _, err = registry.CreateKey(registry.CURRENT_USER, RegKeyPath, registry.SET_VALUE)
	if err != nil {
		log.Println("[-] No se pudo crear clave de registro:", err)
		return
	}
	defer k.Close()

	err = k.SetStringValue(RegValue, UUID)
	if err != nil {
		log.Println("[-] No se pudo guardar UUID en el registro:", err)
	}
}
