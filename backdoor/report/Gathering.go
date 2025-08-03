package report

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"unsafe"

	"github.com/jackpal/gateway"
	"github.com/shirou/gopsutil/process"
	"github.com/shirou/gopsutil/v3/host"
	netutl "github.com/shirou/gopsutil/v3/net"
	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

func GetSysInfo() (hostname, osInfo, arch, userName string, err error) {
	h, _ := os.Hostname()
	hostname = h
	info, _ := host.Info()
	osInfo = info.Platform + " " + info.PlatformVersion
	arch = runtime.GOARCH
	u, _ := user.Current()
	userName = u.Username
	return
}

func GetIPs() ([]string, error) {
	var out []string
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}
	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 {
			continue
		}
		if iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			default:
				continue
			}
			if ip == nil || ip.IsLoopback() {
				continue
			}
			ip = ip.To4()
			if ip == nil {
				continue
			}
			out = append(out, ip.String())
		}
	}
	return out, nil
}

func connectionTypeToString(connType uint32) string {
	switch connType {
	case 1:
		return "tcp"
	case 2:
		return "udp"
	case 3:
		return "tcp6"
	case 4:
		return "udp6"
	case 5:
		return "unix"
	case 6:
		return "unixgram"
	case 7:
		return "unixpacket"
	default:
		return "unknown(" + strconv.Itoa(int(connType)) + ")"
	}
}

func GetConns() ([]ConnInfo, error) {
	cps, err := netutl.Connections("all")
	if err != nil {
		return nil, err
	}

	var out []ConnInfo
	for _, c := range cps {
		// Manejar direcciones que pueden estar vacías
		localAddr := ""
		remoteAddr := ""

		if c.Laddr.IP != "" || c.Laddr.Port != 0 {
			localAddr = c.Laddr.String()
		}

		if c.Raddr.IP != "" || c.Raddr.Port != 0 {
			remoteAddr = c.Raddr.String()
		}

		out = append(out, ConnInfo{
			Protocol: connectionTypeToString(c.Type), // Convertir uint32 a string
			Local:    localAddr,
			Remote:   remoteAddr,
			Status:   c.Status,
		})
	}
	return out, nil
}

func GetProcesses() []ProcessInfo {
	procs, _ := process.Processes()
	var out []ProcessInfo
	for _, p := range procs {
		name, _ := p.Name()
		cpu, _ := p.CPUPercent()
		mem, _ := p.MemoryPercent()
		out = append(out, ProcessInfo{
			PID:    p.Pid,
			Name:   name,
			CPU:    cpu,
			Memory: mem,
		})
	}
	return out
}

func GetDefaultGateway() string {
	ip, err := gateway.DiscoverGateway()
	if err != nil {
		return ""
	}
	return ip.String()
}

func GetDNS() []string {
	var out []string
	if runtime.GOOS == "windows" {
		k, err := registry.OpenKey(registry.LOCAL_MACHINE,
			`SYSTEM\CurrentControlSet\Services\Tcpip\Parameters`, registry.QUERY_VALUE)
		if err == nil {
			defer k.Close()
			if v, _, err := k.GetStringValue("NameServer"); err == nil {
				out = strings.Split(v, ",")
			}
		}
	} else {
		data, err := os.ReadFile("/etc/resolv.conf")
		if err == nil {
			for _, line := range strings.Split(string(data), "\n") {
				if strings.HasPrefix(line, "nameserver") {
					fields := strings.Fields(line)
					if len(fields) >= 2 {
						out = append(out, fields[1])
					}
				}
			}
		}
	}
	return out
}

func GetPersistencePoints() []string {
	var out []string
	if runtime.GOOS == "windows" {
		// Run keys en HKCU y HKLM
		for _, path := range []registry.Key{registry.CURRENT_USER, registry.LOCAL_MACHINE} {
			k, err := registry.OpenKey(path,
				`Software\Microsoft\Windows\CurrentVersion\Run`, registry.READ)
			if err != nil {
				continue
			}
			defer k.Close()
			names, _ := k.ReadValueNames(0)
			for _, name := range names {
				if cmd, _, err := k.GetStringValue(name); err == nil {
					out = append(out, "RunKey: "+name+" -> "+cmd)
				}
			}
		}
	} else {
		// Crontab del usuario
		cmd := exec.Command("crontab", "-l")
		buf, err := cmd.Output()
		if err == nil {
			for _, line := range strings.Split(string(buf), "\n") {
				if strings.TrimSpace(line) != "" && !strings.HasPrefix(line, "#") {
					out = append(out, "cron: "+line)
				}
			}
		}
	}
	return out
}

func hashFile(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	hasher := sha256.New()
	if _, err := io.Copy(hasher, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(hasher.Sum(nil)), nil
}

func GetFileArtifacts() []FileInfo {
	var out []FileInfo
	usr, err := user.Current()
	if err != nil {
		return out
	}

	filepath.Walk(usr.HomeDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		ext := strings.ToLower(filepath.Ext(path))
		if ext == ".txt" || ext == ".pdf" {
			hash, err := hashFile(path)
			if err != nil {
				// opcional: loguear el error en lugar de ignorar
				return nil
			}
			out = append(out, FileInfo{
				Path: path,
				Hash: hash,
			})
		}
		return nil
	})
	return out
}

func GetCommandHistory() []string {
	var out []string
	if runtime.GOOS == "windows" {
		usr, _ := user.Current()
		histFile := filepath.Join(usr.HomeDir,
			`AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt`)
		data, err := os.ReadFile(histFile)
		if err == nil {
			out = strings.Split(string(data), "\n")
		}
	} else {
		usr, _ := user.Current()
		data, err := os.ReadFile(filepath.Join(usr.HomeDir, ".bash_history"))
		if err == nil {
			out = strings.Split(string(data), "\n")
		}
	}
	return out
}

func isRoot() bool {
	return os.Geteuid() == 0
}

func isElevatedWindows() bool {
	// 1) Abrimos el token del proceso actual
	var token windows.Token
	err := windows.OpenProcessToken(windows.CurrentProcess(), windows.TOKEN_QUERY, &token)
	if err != nil {
		return false
	}
	defer token.Close()

	// 2) Obtenemos la información TokenElevation
	var elevation struct {
		TokenIsElevated uint32
	}
	var outLen uint32
	err = windows.GetTokenInformation(
		token,
		windows.TokenElevation,
		(*byte)(unsafe.Pointer(&elevation)),
		uint32(unsafe.Sizeof(elevation)),
		&outLen,
	)
	if err != nil {
		return false
	}

	// 3) Si TokenIsElevated != 0, somos admin
	return elevation.TokenIsElevated != 0
}

func IsElevated() bool {
	if runtime.GOOS == "windows" {
		return isElevatedWindows()
	}
	return isRoot()
}
