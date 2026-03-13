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

	"github.com/jackpal/gateway"
	"github.com/shirou/gopsutil/process"
	"github.com/shirou/gopsutil/v3/host"
	netutl "github.com/shirou/gopsutil/v3/net"
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
		localAddr := ""
		remoteAddr := ""

		if c.Laddr.IP != "" || c.Laddr.Port != 0 {
			localAddr = c.Laddr.String()
		}

		if c.Raddr.IP != "" || c.Raddr.Port != 0 {
			remoteAddr = c.Raddr.String()
		}

		out = append(out, ConnInfo{
			Protocol: connectionTypeToString(c.Type),
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
		// Intentar obtener del registro primero (solo en Windows)
		registryDNS := GetDNSFromRegistry()
		if len(registryDNS) > 0 {
			out = append(out, registryDNS...)
		}

		// Fallback: usar nslookup
		cmd := exec.Command("nslookup", "google.com")
		output, err := cmd.Output()
		if err == nil {
			lines := strings.Split(string(output), "\n")
			for _, line := range lines {
				if strings.Contains(line, "Server:") {
					parts := strings.Fields(line)
					if len(parts) >= 2 {
						out = append(out, parts[1])
					}
				}
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
		// Windows (igual que antes)
		windowsPoints := GetWindowsPersistencePoints()
		out = append(out, windowsPoints...)

		usr, err := user.Current()
		if err == nil {
			startupPaths := []string{
				filepath.Join(usr.HomeDir, "AppData", "Roaming", "Microsoft", "Windows", "Start Menu", "Programs", "Startup"),
				"C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup",
			}

			for _, path := range startupPaths {
				files, err := os.ReadDir(path)
				if err == nil {
					for _, file := range files {
						if !file.IsDir() {
							out = append(out, "Startup: "+filepath.Join(path, file.Name()))
						}
					}
				}
			}
		}
	} else {
		// Linux/Unix
		usr, err := user.Current()
		if err == nil {
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

			// Archivos autostart .desktop
			autostartPath := filepath.Join(usr.HomeDir, ".config", "autostart")
			files, err := os.ReadDir(autostartPath)
			if err == nil {
				for _, file := range files {
					if strings.HasSuffix(file.Name(), ".desktop") {
						out = append(out, "autostart: "+file.Name())
					}
				}
			}

			// Chequeo adicional: archivo ~/.bashrc
			bashrcPath := filepath.Join(usr.HomeDir, ".bashrc")
			bashrcContent, err := os.ReadFile(bashrcPath)
			if err == nil {
				lines := strings.Split(string(bashrcContent), "\n")
				for _, line := range lines {
					if strings.HasSuffix(strings.TrimSpace(line), "&") {
						out = append(out, "bashrc: "+strings.TrimSpace(line))
					}
				}
			}
		}

		// Chequear si existe el servicio Systemd
		servicePath := "/etc/systemd/system/backdoor.service"
		if _, err := os.Stat(servicePath); err == nil {
			out = append(out, "systemd: "+servicePath)
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

	// Limitar a primeros 1000 archivos para evitar que sea muy lento
	count := 0
	maxFiles := 1000

	filepath.Walk(usr.HomeDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() || count >= maxFiles {
			return nil
		}

		ext := strings.ToLower(filepath.Ext(path))
		if ext == ".txt" || ext == ".pdf" || ext == ".doc" || ext == ".docx" {
			hash, err := hashFile(path)
			if err == nil {
				out = append(out, FileInfo{
					Path: path,
					Hash: hash,
				})
				count++
			}
		}
		return nil
	})
	return out
}

func GetCommandHistory() []string {
	var out []string
	usr, err := user.Current()
	if err != nil {
		return out
	}

	if runtime.GOOS == "windows" {
		// PowerShell history
		histFiles := []string{
			filepath.Join(usr.HomeDir, "AppData", "Roaming", "Microsoft", "Windows", "PowerShell", "PSReadLine", "ConsoleHost_history.txt"),
			filepath.Join(usr.HomeDir, "AppData", "Roaming", "Microsoft", "Windows", "PowerShell", "PSReadLine", "Visual Studio Code Host_history.txt"),
		}

		for _, histFile := range histFiles {
			data, err := os.ReadFile(histFile)
			if err == nil {
				lines := strings.Split(string(data), "\n")
				out = append(out, lines...)
			}
		}
	} else {
		// Múltiples archivos de historial en Unix
		histFiles := []string{
			filepath.Join(usr.HomeDir, ".bash_history"),
			filepath.Join(usr.HomeDir, ".zsh_history"),
			filepath.Join(usr.HomeDir, ".history"),
		}

		for _, histFile := range histFiles {
			data, err := os.ReadFile(histFile)
			if err == nil {
				lines := strings.Split(string(data), "\n")
				out = append(out, lines...)
			}
		}
	}

	// Filtrar líneas vacías
	var filtered []string
	for _, line := range out {
		if strings.TrimSpace(line) != "" {
			filtered = append(filtered, line)
		}
	}

	return filtered
}

func IsElevated() bool {
	return isElevatedUser() // Esta función está definida en los archivos específicos de cada OS
}

// ScanEnvCredentials escanea variables de entorno en busca de credenciales o tokens.
func ScanEnvCredentials() []EnvCredential {
	keywords := []string{
		"KEY", "TOKEN", "SECRET", "PASSWORD", "PASS", "PWD",
		"API", "AWS", "AZURE", "GCP", "GOOGLE", "GITHUB", "GITLAB",
		"CREDENTIAL", "AUTH", "BEARER", "ACCESS", "PRIVATE",
	}
	var creds []EnvCredential
	for _, env := range os.Environ() {
		parts := strings.SplitN(env, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.ToUpper(parts[0])
		value := parts[1]
		if value == "" {
			continue
		}
		for _, kw := range keywords {
			if strings.Contains(key, kw) {
				// Enmascarar parte del valor para no exponer todo en texto plano
				masked := value
				if len(value) > 6 {
					masked = value[:3] + strings.Repeat("*", len(value)-6) + value[len(value)-3:]
				}
				creds = append(creds, EnvCredential{Key: parts[0], Value: masked})
				break
			}
		}
	}
	return creds
}
