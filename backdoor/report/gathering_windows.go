//go:build windows
// +build windows

package report

import (
	"strings"
	"unsafe"

	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

// Función específica de Windows para obtener DNS del registro
func GetDNSFromRegistry() []string {
	var out []string
	k, err := registry.OpenKey(registry.LOCAL_MACHINE,
		`SYSTEM\CurrentControlSet\Services\Tcpip\Parameters`, registry.QUERY_VALUE)
	if err == nil {
		defer k.Close()
		if v, _, err := k.GetStringValue("NameServer"); err == nil {
			out = strings.Split(v, ",")
		}
	}
	return out
}

// Función específica de Windows para obtener puntos de persistencia del registro
func GetWindowsPersistencePoints() []string {
	var out []string

	// Run keys en HKCU y HKLM
	for _, root := range []registry.Key{registry.CURRENT_USER, registry.LOCAL_MACHINE} {
		runPaths := []string{
			`Software\Microsoft\Windows\CurrentVersion\Run`,
			`Software\Microsoft\Windows\CurrentVersion\RunOnce`,
		}

		for _, path := range runPaths {
			k, err := registry.OpenKey(root, path, registry.READ)
			if err != nil {
				continue
			}
			defer k.Close()

			names, err := k.ReadValueNames(0)
			if err != nil {
				continue
			}

			for _, name := range names {
				if cmd, _, err := k.GetStringValue(name); err == nil {
					out = append(out, "RunKey: "+name+" -> "+cmd)
				}
			}
		}
	}

	return out
}

// Función específica de Windows para verificar privilegios elevados
func isElevatedUser() bool {
	// 1) Abrimos el token del proceso actual
	var token windows.Token
	err := windows.OpenProcessToken(windows.CurrentProcess(), windows.TOKEN_QUERY, &token)
	if err != nil {
		return false
	}
	defer token.Close()

	// 2) Obtenemos la información TokenElevation
	var elevation struct {
		TokenIsElevated uint32
	}
	var outLen uint32
	err = windows.GetTokenInformation(
		token,
		windows.TokenElevation,
		(*byte)(unsafe.Pointer(&elevation)),
		uint32(unsafe.Sizeof(elevation)),
		&outLen,
	)
	if err != nil {
		return false
	}

	// 3) Si TokenIsElevated != 0, somos admin
	return elevation.TokenIsElevated != 0
}
