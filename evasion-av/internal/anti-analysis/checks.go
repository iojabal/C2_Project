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
	var isRemoteDebugger bool
	kernel32 := windows.NewLazyDLL("kernel32.dll")
	proc := kernel32.NewProc("CheckRemoteDebuggerPresent")
	proc.Call(
		uintptr(windows.CurrentProcess()),
		uintptr(unsafe.Pointer(&isRemoteDebugger)),
	)
	return isRemoteDebugger
}

// CONTEXT_AMD64 es el struct completo para x64 (1232 bytes).
// ContextFlags está en offset 0x30, Dr0-Dr7 en offset 0x318.
type CONTEXT_AMD64 struct {
	P1Home               uint64
	P2Home               uint64
	P3Home               uint64
	P4Home               uint64
	P5Home               uint64
	P6Home               uint64
	ContextFlags         uint32
	MxCsr                uint32
	SegCs                uint16
	SegDs                uint16
	SegEs                uint16
	SegFs                uint16
	SegGs                uint16
	SegSs                uint16
	EFlags               uint32
	_                    uint32 // padding
	Dr0                  uint64
	Dr1                  uint64
	Dr2                  uint64
	Dr3                  uint64
	Dr6                  uint64
	Dr7                  uint64
	Rax                  uint64
	Rcx                  uint64
	Rdx                  uint64
	Rbx                  uint64
	Rsp                  uint64
	Rbp                  uint64
	Rsi                  uint64
	Rdi                  uint64
	R8                   uint64
	R9                   uint64
	R10                  uint64
	R11                  uint64
	R12                  uint64
	R13                  uint64
	R14                  uint64
	R15                  uint64
	Rip                  uint64
	_                    [512]byte // FltSave / XMM registers
	VectorRegister       [26][16]byte
	VectorControl        uint64
	DebugControl         uint64
	LastBranchToRip      uint64
	LastBranchFromRip    uint64
	LastExceptionToRip   uint64
	LastExceptionFromRip uint64
}

const CONTEXT_DEBUG_REGISTERS = 0x00010010

func checkHardwareBreakpoints() bool {
	// Obtener un handle real al hilo actual (pseudo-handle no funciona con GetThreadContext)
	kernel32 := windows.NewLazyDLL("kernel32.dll")
	openThread := kernel32.NewProc("OpenThread")
	tid := windows.GetCurrentThreadId()
	hThread, _, _ := openThread.Call(
		uintptr(windows.THREAD_GET_CONTEXT),
		0,
		uintptr(tid),
	)
	if hThread == 0 {
		return false
	}
	defer windows.CloseHandle(windows.Handle(hThread))

	var ctx CONTEXT_AMD64
	ctx.ContextFlags = CONTEXT_DEBUG_REGISTERS

	modntdll := syscall.NewLazyDLL("ntdll.dll")
	procGetThreadContext := modntdll.NewProc("GetThreadContext")
	ret, _, _ := procGetThreadContext.Call(
		hThread,
		uintptr(unsafe.Pointer(&ctx)),
	)
	if ret == 0 {
		return false
	}

	return ctx.Dr0 != 0 || ctx.Dr1 != 0 || ctx.Dr2 != 0 || ctx.Dr3 != 0
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
	common := []string{
		"explorer.exe", "cmd.exe", "svchost.exe", "services.exe", "wininit.exe",
		"powershell.exe", "pwsh.exe", "wsmprovhost.exe", "wscript.exe", "mshta.exe",
	}
	for _, p := range common {
		if strings.EqualFold(name, p) {
			return true
		}
	}
	return false
}
