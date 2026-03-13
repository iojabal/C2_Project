//go:build !windows
// +build !windows

package report

import (
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"strings"
)

func GetDNSFromRegistry() []string { return []string{} }

func GetWindowsPersistencePoints() []string { return []string{} }

func isElevatedUser() bool { return os.Geteuid() == 0 }

// GetWiFiNetworks intenta obtener redes WiFi con nmcli (Linux).
func GetWiFiNetworks() []WiFiNetwork {
	out, err := exec.Command("nmcli", "-t", "-f", "NAME,TYPE", "connection", "show").Output()
	if err != nil { return nil }
	var networks []WiFiNetwork
	for _, line := range strings.Split(string(out), "\n") {
		parts := strings.SplitN(line, ":", 2)
		if len(parts) == 2 && strings.Contains(parts[1], "wireless") {
			ssid := strings.TrimSpace(parts[0])
			networks = append(networks, WiFiNetwork{SSID: ssid, Password: ""})
		}
	}
	return networks
}

// GetLocalUsers lista usuarios del sistema desde /etc/passwd.
func GetLocalUsers() []LocalUser {
	data, err := os.ReadFile("/etc/passwd")
	if err != nil { return nil }
	var users []LocalUser
	for _, line := range strings.Split(string(data), "\n") {
		fields := strings.Split(line, ":")
		if len(fields) < 4 { continue }
		uid := fields[2]
		if uid == "" { continue }
		// UIDs >= 1000 son usuarios normales (o uid 0 = root)
		isSystem := uid != "0" && (len(uid) < 4 || uid < "1000")
		if isSystem { continue }
		users = append(users, LocalUser{
			Username: fields[0],
			IsAdmin:  uid == "0",
			IsActive: true,
		})
	}
	return users
}

// GetSecurityProducts detecta herramientas de seguridad en Linux.
func GetSecurityProducts() []string {
	known := []string{"clamd", "clamav", "rkhunter", "chkrootkit", "tripwire", "ossec", "wazuh", "falco"}
	out, err := exec.Command("ps", "aux").Output()
	if err != nil { return nil }
	var found []string
	seen := make(map[string]bool)
	for _, proc := range known {
		if strings.Contains(string(out), proc) && !seen[proc] {
			seen[proc] = true
			found = append(found, proc)
		}
	}
	return found
}

// GetTokenPrivileges retorna grupos e info de privilegios del usuario actual.
func GetTokenPrivileges() []string {
	out, err := exec.Command("id").Output()
	if err != nil { return nil }
	return []string{strings.TrimSpace(string(out))}
}

// GetBrowserProfiles detecta navegadores instalados en Linux.
func GetBrowserProfiles() []string {
	usr, err := user.Current()
	if err != nil { return nil }
	home := usr.HomeDir
	checks := []struct{ name, path string }{
		{"Google Chrome", filepath.Join(home, ".config", "google-chrome")},
		{"Mozilla Firefox", filepath.Join(home, ".mozilla", "firefox")},
		{"Brave", filepath.Join(home, ".config", "BraveSoftware", "Brave-Browser")},
		{"Chromium", filepath.Join(home, ".config", "chromium")},
	}
	var found []string
	for _, c := range checks {
		if _, err := os.Stat(c.path); err == nil { found = append(found, c.name) }
	}
	return found
}

// GetInstalledApps lista paquetes relevantes para pentesting en Linux.
func GetInstalledApps() []InstalledApp {
	// Intentar con dpkg (Debian/Ubuntu)
	out, err := exec.Command("dpkg", "-l").Output()
	if err != nil {
		// Intentar con rpm (RHEL/CentOS)
		out, err = exec.Command("rpm", "-qa", "--queryformat", "%{NAME} %{VERSION}\n").Output()
		if err != nil { return nil }
	}
	interesting := []string{
		"keepass", "bitwarden", "openssh", "filezilla", "git",
		"openvpn", "wireguard", "docker", "kubectl",
		"wireshark", "nmap", "burp", "metasploit",
	}
	var apps []InstalledApp
	seen := make(map[string]bool)
	for _, line := range strings.Split(string(out), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 2 { continue }
		name := strings.ToLower(fields[0])
		for _, kw := range interesting {
			if strings.Contains(name, kw) && !seen[name] {
				seen[name] = true
				version := ""
				if len(fields) > 2 { version = fields[2] }
				apps = append(apps, InstalledApp{Name: fields[0], Version: version})
				break
			}
		}
	}
	return apps
}

// GetDomainName retorna el dominio del sistema en Linux.
func GetDomainName() string {
	out, err := exec.Command("hostname", "-d").Output()
	if err != nil { return "" }
	return strings.TrimSpace(string(out))
}