package persistence

import (
	"fmt"
	"runtime"
)

func GetPersistenceStrategy() (PersistenceStrategy, error) {
	switch runtime.GOOS {
	case "windows":
		return &WindowsPersistence{}, nil
	case "linux":
		return &LinuxPersistence{}, nil
	default:
		return nil, fmt.Errorf("persistencia no implementada para %s", runtime.GOOS)
	}
}
