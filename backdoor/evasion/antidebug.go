package evasion

import (
	"fmt"
	"os"
	"syscall"
	"time"
	"unsafe"
)

func StartAntiDebugLoop() {
	go func() {
		for {
			fmt.Println("[DEBUG] Ejecutando chequeo de anti-debug...")

			if IsDebuggerPresent() {
				fmt.Println("Debugger detectado en runtime (IsDebuggerPresent)")
				os.Exit(1)
			}

			kernel := syscall.NewLazyDLL("kernel32.dll")
			sleepProc := kernel.NewProc("Sleep")

			if HasBreakpoint(sleepProc.Addr()) {
				fmt.Println("Breakpoint detectado en runtime (Sleep)")
				os.Exit(1)
			}

			time.Sleep(5 * time.Second)
		}
	}()
}

func IsDebuggerPresent() bool {
	kernel := syscall.NewLazyDLL("kernel32.dll")
	proc := kernel.NewProc("IsDebuggerPresent")
	ret, _, _ := proc.Call()
	return ret != 0
}

func HasBreakpoint(addr uintptr) bool {
	var b [1]byte
	var bytesRead uintptr
	size := uintptr(1)

	kernel := syscall.NewLazyDLL("kernel32.dll")
	read := kernel.NewProc("ReadProcessMemory")
	process, _ := syscall.GetCurrentProcess()

	ret, _, _ := read.Call(uintptr(process), addr, uintptr(unsafe.Pointer(&b[0])), size, uintptr(unsafe.Pointer(&bytesRead)))

	if ret == 0 {
		fmt.Println("[WARN] ReadProcessMemory falló (no se pudo leer)")
		return false // evitar falso positivo
	}

	return b[0] == 0xCC
}

func AntiDebugChecks() {
	if IsDebuggerPresent() {
		fmt.Println("Debugger detectado con IsDebuggerPresent")
		os.Exit(1)
	}

	// Usamos una función real del sistema cargada en memoria
	kernel := syscall.NewLazyDLL("kernel32.dll")
	sleepProc := kernel.NewProc("Sleep")

	if HasBreakpoint(sleepProc.Addr()) {
		fmt.Println("Breakpoint detectado en kernel32.Sleep")
		os.Exit(1)
	}
}
