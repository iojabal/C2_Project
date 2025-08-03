package injection

import (
	"errors"

	"github.com/f1zm0/acheron"
)

type InjectionType int

const (
	ProcessInjection InjectionType = iota
	ProcessHollowing
)

type ProcessInjector interface {
	Inject(targetProc string, payload []byte) error
}

func NewInjector(t InjectionType, ach *acheron.Acheron) (ProcessInjector, error) {
	switch t {
	case ProcessInjection:
		return &ClassicInjector{acheron: ach}, nil
	case ProcessHollowing:
		return &HollowingInjector{acheron: ach}, nil
	default:
		return nil, errors.New("tipo de inyección no soportado")
	}
}

func FromString(name string) (InjectionType, error) {
	switch name {
	case "ProcessInjection":
		return ProcessInjection, nil
	case "ProcessHollowing":
		return ProcessHollowing, nil
	default:
		return -1, errors.New("tipo de inyección no reconocido")
	}
}
