//go:build linux
// +build linux

package evasion

import (
	"bytes"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// StartAntiDebugLoop inicia el chequeo anti-debug cada 5 segundos en un bucle
func StartAntiDebugLoop() {
	go func() {
		for {
			if IsDebuggerPresent() {
				fmt.Println("Debugger detectado en runtime (/proc/self/status)")
				os.Exit(1)
			}

			if HasTracerPid() {
				fmt.Println("Debugger detectado mediante TracerPid")
				os.Exit(1)
			}

			time.Sleep(5 * time.Second)
		}
	}()
}

// IsDebuggerPresent comprueba si el proceso actual está siendo debugueado
func IsDebuggerPresent() bool {
	data, err := os.ReadFile("/proc/self/status")
	if err != nil {
		return false
	}
	return bytes.Contains(data, []byte("TracerPid:\t0")) == false
}

// HasTracerPid verifica específicamente el valor TracerPid en /proc/self/status
func HasTracerPid() bool {
	data, err := os.ReadFile("/proc/self/status")
	if err != nil {
		return false
	}

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "TracerPid:") {
			fields := strings.Fields(line)
			if len(fields) == 2 {
				pid, err := strconv.Atoi(fields[1])
				if err == nil && pid != 0 {
					return true
				}
			}
		}
	}
	return false
}

// AntiDebugChecks realiza una comprobación inmediata (sin bucle)
func AntiDebugChecks() {
	if IsDebuggerPresent() {
		fmt.Println("Debugger detectado con IsDebuggerPresent (/proc/self/status)")
		os.Exit(1)
	}

	if HasTracerPid() {
		fmt.Println("Debugger detectado mediante TracerPid")
		os.Exit(1)
	}
}
