package anti_analysis

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"syscall"
	"time"
	"unsafe"

	"golang.org/x/sys/windows"
)

type DebuggingCheck struct {
	checks []func() bool
}

func NewDebuggingCheck() *DebuggingCheck {
	return &DebuggingCheck{
		checks: []func() bool{
			checkDebuggerPresent,
			checkProcessDebugFlags,
			checkDebuggerViaException,
			checkHardwareBreakpoints,
			checkNtGlobalFlag,
			checkParentProcess,
			checkWindowClassName,
			checkTimeChecks,
		},
	}
}

func (dc *DebuggingCheck) IsDebugged() bool {
	for _, check := range dc.checks {
		if check() {
			return true
		}
	}
	return false
}

func checkDebuggerPresent() bool {
	kernel32 := windows.NewLazyDLL("kernel32.dll")
	proc := kernel32.NewProc("IsDebuggerPresent")
	ret, _, _ := proc.Call()
	return ret != 0
}

func checkProcessDebugFlags() bool {
	var debugFlags uint32
	ntdll := windows.NewLazyDLL("ntdll.dll")
	proc := ntdll.NewProc("NtQueryInformationProcess")
	ret, _, _ := proc.Call(
		uintptr(windows.CurrentProcess()),
		0x1F,
		uintptr(unsafe.Pointer(&debugFlags)),
		uintptr(unsafe.Sizeof(debugFlags)),
		0,
	)
	return ret == 0 && debugFlags == 0
}

func checkDebuggerViaException() bool {
	defer func() {
		recover()
	}()
	_, _, _ = syscall.Syscall(0, 0, 0, 0, 0)
	return false
}

type CONTEXT struct {
	ContextFlags uint32
	Dr0          uint32
	Dr1          uint32
	Dr2          uint32
	Dr3          uint32
	Dr6          uint32
	Dr7          uint32
	// ... (otros campos omitidos para brevedad)
}

const CONTEXT_DEBUG_REGISTERS = 0x00010010

func checkHardwareBreakpoints() bool {
	thread := windows.CurrentThread()
	defer windows.CloseHandle(thread)

	var context CONTEXT
	context.ContextFlags = CONTEXT_DEBUG_REGISTERS

	// Usamos syscall en lugar de windows.GetThreadContext
	modntdll := syscall.NewLazyDLL("ntdll.dll")
	procGetThreadContext := modntdll.NewProc("GetThreadContext")
	ret, _, _ := procGetThreadContext.Call(
		uintptr(thread),
		uintptr(unsafe.Pointer(&context)),
	)

	if ret == 0 {
		return false
	}

	return context.Dr0 != 0 || context.Dr1 != 0 || context.Dr2 != 0 || context.Dr3 != 0
}

type PEB struct {
	Reserved1              [2]byte
	BeingDebugged          byte
	Reserved2              [21]byte
	LoadOrderModuleList    uintptr
	Reserved3              [45]uintptr
	Reserved4              [96]byte
	PostProcessInitRoutine uintptr
	Reserved5              [128]byte
	Reserved6              [1]uintptr
	SessionId              uint32
}

func checkNtGlobalFlag() bool {
	modntdll := syscall.NewLazyDLL("ntdll.dll")
	procRtlGetCurrentPeb := modntdll.NewProc("RtlGetCurrentPeb")
	pebPtr, _, _ := procRtlGetCurrentPeb.Call()

	peb := (*PEB)(unsafe.Pointer(pebPtr))
	return peb.BeingDebugged != 0
}

func checkParentProcess() bool {
	snapshot, err := windows.CreateToolhelp32Snapshot(windows.TH32CS_SNAPPROCESS, 0)
	if err != nil {
		return false
	}
	defer windows.CloseHandle(snapshot)

	var entry windows.ProcessEntry32
	entry.Size = uint32(unsafe.Sizeof(entry))
	currentPid := windows.GetCurrentProcessId()

	for windows.Process32Next(snapshot, &entry) == nil {
		if entry.ProcessID == currentPid {
			parentName := syscall.UTF16ToString(entry.ExeFile[:])
			return !isCommonParent(parentName)
		}
	}
	return false
}

func checkWindowClassName() bool {
	user32 := windows.NewLazyDLL("user32.dll")
	proc := user32.NewProc("FindWindowW")
	debuggerWindows := []string{"OLLYDBG", "WinDbgFrameClass", "ID", "dnSpy", "x64dbg", "Immunity"}

	for _, cls := range debuggerWindows {
		clsPtr, _ := syscall.UTF16PtrFromString(cls)
		ret, _, _ := proc.Call(uintptr(unsafe.Pointer(clsPtr)), 0)
		if ret != 0 {
			return true
		}
	}
	return false
}

func checkTimeChecks() bool {
	start := time.Now()
	h := sha256.New()
	for i := 0; i < 100000; i++ {
		h.Write([]byte{byte(i % 256)})
	}
	_ = hex.EncodeToString(h.Sum(nil)) // Forzar cálculo completo
	elapsed := time.Since(start)
	return elapsed > 500*time.Millisecond
}

func isCommonParent(name string) bool {
	common := []string{"explorer.exe", "cmd.exe", "svchost.exe", "services.exe", "wininit.exe"}
	for _, p := range common {
		if strings.EqualFold(name, p) {
			return true
		}
	}
	return false
}
