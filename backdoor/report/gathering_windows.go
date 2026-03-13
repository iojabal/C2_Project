//go:build windows
// +build windows

package report

import (
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"runtime"
	"strings"
	"unsafe"

	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

func GetDNSFromRegistry() []string {
	var out []string
	k, err := registry.OpenKey(registry.LOCAL_MACHINE,
		`SYSTEM\CurrentControlSet\Services\Tcpip\Parameters`, registry.QUERY_VALUE)
	if err == nil {
		defer k.Close()
		if v, _, err := k.GetStringValue("NameServer"); err == nil {
			out = strings.Split(v, ",")
		}
	}
	return out
}

func GetWindowsPersistencePoints() []string {
	var out []string
	for _, root := range []registry.Key{registry.CURRENT_USER, registry.LOCAL_MACHINE} {
		runPaths := []string{
			`Software\Microsoft\Windows\CurrentVersion\Run`,
			`Software\Microsoft\Windows\CurrentVersion\RunOnce`,
		}
		for _, rpath := range runPaths {
			k, err := registry.OpenKey(root, rpath, registry.READ)
			if err != nil { continue }
			defer k.Close()
			names, err := k.ReadValueNames(0)
			if err != nil { continue }
			for _, name := range names {
				if cmd, _, err := k.GetStringValue(name); err == nil {
					out = append(out, "RunKey: "+name+" -> "+cmd)
				}
			}
		}
	}
	return out
}

func isElevatedUser() bool {
	var token windows.Token
	err := windows.OpenProcessToken(windows.CurrentProcess(), windows.TOKEN_QUERY, &token)
	if err != nil { return false }
	defer token.Close()
	var elevation struct{ TokenIsElevated uint32 }
	var outLen uint32
	err = windows.GetTokenInformation(token, windows.TokenElevation,
		(*byte)(unsafe.Pointer(&elevation)), uint32(unsafe.Sizeof(elevation)), &outLen)
	if err != nil { return false }
	return elevation.TokenIsElevated != 0
}

// GetWiFiNetworks extrae SSIDs y contraseñas WiFi guardadas en el sistema.
func GetWiFiNetworks() []WiFiNetwork {
	out, err := exec.Command("netsh", "wlan", "show", "profiles").Output()
	if err != nil { return nil }
	var networks []WiFiNetwork
	for _, line := range strings.Split(string(out), "\n") {
		if !strings.Contains(line, ":") { continue }
		lower := strings.ToLower(line)
		if !strings.Contains(lower, "all user profile") && !strings.Contains(lower, "perfil de todos") { continue }
		parts := strings.SplitN(line, ":", 2)
		if len(parts) < 2 { continue }
		ssid := strings.TrimSpace(parts[1])
		if ssid == "" { continue }
		password := ""
		detail, err := exec.Command("netsh", "wlan", "show", "profile", "name="+ssid, "key=clear").Output()
		if err == nil {
			for _, dline := range strings.Split(string(detail), "\n") {
				dl := strings.ToLower(dline)
				if strings.Contains(dl, "key content") || strings.Contains(dl, "contenido de clave") {
					dp := strings.SplitN(dline, ":", 2)
					if len(dp) == 2 { password = strings.TrimSpace(dp[1]) }
				}
			}
		}
		networks = append(networks, WiFiNetwork{SSID: ssid, Password: password})
	}
	return networks
}

// GetLocalUsers lista usuarios locales e indica si son administradores.
func GetLocalUsers() []LocalUser {
	adminOut, _ := exec.Command("net", "localgroup", "administrators").Output()
	adminStr := strings.ToLower(string(adminOut))
	usrOut, err := exec.Command("net", "user").Output()
	if err != nil { return nil }
	var users []LocalUser
	inSection := false
	for _, line := range strings.Split(string(usrOut), "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "---") { inSection = true; continue }
		if !inSection || line == "" { continue }
		lower := strings.ToLower(line)
		if strings.Contains(lower, "the command") || strings.Contains(lower, "el comando") { continue }
		for _, username := range strings.Fields(line) {
			if username == "" { continue }
			isAdmin := strings.Contains(adminStr, strings.ToLower(username))
			isActive := true
			detail, err := exec.Command("net", "user", username).Output()
			if err == nil {
				for _, dl := range strings.Split(string(detail), "\n") {
					dl = strings.TrimSpace(dl)
					dlLower := strings.ToLower(dl)
					if strings.HasPrefix(dlLower, "account active") || strings.HasPrefix(dlLower, "cuenta activa") {
						if strings.Contains(dlLower, "no") { isActive = false }
						break
					}
				}
			}
			users = append(users, LocalUser{Username: username, IsAdmin: isAdmin, IsActive: isActive})
		}
	}
	return users
}

// GetSecurityProducts detecta AV/EDR via WMI y por lista de procesos conocidos.
func GetSecurityProducts() []string {
	var found []string
	wmiOut, err := exec.Command("wmic", "/namespace:\\\\root\\SecurityCenter2",
		"path", "AntiVirusProduct", "get", "displayName", "/value").Output()
	if err == nil {
		for _, line := range strings.Split(string(wmiOut), "\n") {
			if strings.HasPrefix(strings.ToLower(line), "displayname=") {
				val := strings.TrimSpace(strings.SplitN(line, "=", 2)[1])
				if val != "" { found = append(found, val) }
			}
		}
	}
	if len(found) > 0 { return found }
	knownAV := map[string]string{
		"MsMpEng.exe": "Windows Defender", "avgnt.exe": "Avast",
		"avastsvc.exe": "Avast", "mcshield.exe": "McAfee", "mfemactl.exe": "McAfee",
		"SAVAdminService.exe": "Sophos", "SophosUI.exe": "Sophos",
		"bdagent.exe": "Bitdefender", "bdredline.exe": "Bitdefender",
		"cb.exe": "Carbon Black", "MBAMService.exe": "Malwarebytes",
		"ekrn.exe": "ESET NOD32", "egui.exe": "ESET NOD32",
		"avp.exe": "Kaspersky", "ksde.exe": "Kaspersky",
		"ntrtscan.exe": "Trend Micro", "coreFrameworkHost.exe": "Cylance",
		"CylanceSvc.exe": "Cylance", "csfalconservice.exe": "CrowdStrike Falcon",
		"xagt.exe": "FireEye HX", "cyserver.exe": "Cybereason",
		"SentinelServiceHost.exe": "SentinelOne",
	}
	out2, err := exec.Command("tasklist", "/fo", "csv", "/nh").Output()
	if err == nil {
		for _, line := range strings.Split(string(out2), "\n") {
			fields := strings.Split(line, ",")
			if len(fields) == 0 { continue }
			procName := strings.Trim(fields[0], "\"")
			for avProc, avName := range knownAV {
				if strings.EqualFold(procName, avProc) { found = append(found, avName) }
			}
		}
	}
	seen := make(map[string]bool)
	var unique []string
	for _, v := range found {
		if !seen[v] { seen[v] = true; unique = append(unique, v) }
	}
	return unique
}

// GetTokenPrivileges retorna privilegios habilitados del token del proceso.
func GetTokenPrivileges() []string {
	out, err := exec.Command("whoami", "/priv").Output()
	if err != nil { return nil }
	var privs []string
	for _, line := range strings.Split(string(out), "\n") {
		line = strings.TrimSpace(line)
		lower := strings.ToLower(line)
		if (strings.Contains(lower, "enabled") || strings.Contains(lower, "habilitado")) && strings.HasPrefix(line, "Se") {
			fields := strings.Fields(line)
			if len(fields) > 0 { privs = append(privs, fields[0]) }
		}
	}
	return privs
}

// GetBrowserProfiles detecta navegadores por directorios de perfil.
func GetBrowserProfiles() []string {
	usr, err := user.Current()
	if err != nil { return nil }
	home := usr.HomeDir
	checks := []struct{ name, path string }{
		{"Google Chrome", filepath.Join(home, "AppData", "Local", "Google", "Chrome", "User Data")},
		{"Microsoft Edge", filepath.Join(home, "AppData", "Local", "Microsoft", "Edge", "User Data")},
		{"Mozilla Firefox", filepath.Join(home, "AppData", "Roaming", "Mozilla", "Firefox", "Profiles")},
		{"Brave", filepath.Join(home, "AppData", "Local", "BraveSoftware", "Brave-Browser", "User Data")},
		{"Opera", filepath.Join(home, "AppData", "Roaming", "Opera Software", "Opera Stable")},
		{"Vivaldi", filepath.Join(home, "AppData", "Local", "Vivaldi", "User Data")},
	}
	var found []string
	for _, c := range checks {
		if _, err := os.Stat(c.path); err == nil { found = append(found, c.name) }
	}
	return found
}

// GetInstalledApps lista apps relevantes para pentesting desde el registro.
func GetInstalledApps() []InstalledApp {
	var apps []InstalledApp
	seen := make(map[string]bool)
	interesting := []string{
		"keepass", "1password", "lastpass", "bitwarden", "dashlane", "roboform",
		"putty", "winscp", "filezilla", "mobaxterm", "termius",
		"virtualbox", "vmware",
		"python", "ruby", "perl", "git",
		"openvpn", "nordvpn", "expressvpn", "wireguard",
		"anydesk", "teamviewer", "vnc", "radmin",
		"docker", "kubectl",
		"wireshark", "nmap", "burp",
	}
	roots := []registry.Key{registry.LOCAL_MACHINE, registry.CURRENT_USER}
	subkeys := []string{
		`SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`,
		`SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall`,
	}
	for _, root := range roots {
		for _, subkey := range subkeys {
			k, err := registry.OpenKey(root, subkey, registry.READ)
			if err != nil { continue }
			names, err := k.ReadSubKeyNames(0)
			if err != nil { k.Close(); continue }
			for _, name := range names {
				sub, err := registry.OpenKey(k, name, registry.READ)
				if err != nil { continue }
				displayName, _, _ := sub.GetStringValue("DisplayName")
				displayVersion, _, _ := sub.GetStringValue("DisplayVersion")
				sub.Close()
				if displayName == "" || seen[displayName] { continue }
				lower := strings.ToLower(displayName)
				for _, kw := range interesting {
					if strings.Contains(lower, kw) {
						seen[displayName] = true
						apps = append(apps, InstalledApp{Name: displayName, Version: displayVersion})
						break
					}
				}
			}
			k.Close()
		}
	}
	return apps
}

// GetDomainName retorna el dominio AD si el equipo está unido a uno.
func GetDomainName() string {
	_ = runtime.GOOS
	out, err := exec.Command("wmic", "computersystem", "get", "Domain", "/value").Output()
	if err != nil { return "" }
	for _, line := range strings.Split(string(out), "\n") {
		if strings.HasPrefix(strings.ToLower(line), "domain=") {
			val := strings.TrimSpace(strings.SplitN(line, "=", 2)[1])
			if val != "" && !strings.EqualFold(val, "WORKGROUP") { return val }
		}
	}
	return ""
}