package persistence

import (
	"os"
	"os/user"
	"runtime"
)

func IsElevated() bool {
	if runtime.GOOS == "windows" {
		usr, err := user.Current()
		if err != nil {
			return false
		}
		return usr.Username == "SYSTEM" || usr.Username == "Administrator" || usr.Username == "Administrador"
	}

	return os.Geteuid() == 0
}
