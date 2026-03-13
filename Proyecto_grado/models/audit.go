package models

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"proyecto_grado/db"

	"go.mongodb.org/mongo-driver/bson/primitive"
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

// ─── Reporte de auditoría ─────────────────────────────────────────────────────

type AuditReport struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Sequence        int64              `bson:"sequence" json:"sequence"`
	PrevHash        string             `bson:"prev_hash" json:"prev_hash"`
	Hash            string             `bson:"hash" json:"hash"`
	AgentID         string             `bson:"agentid" json:"agent_id"`
	Hostname        string             `bson:"hostname" json:"hostname"`
	OS              string             `bson:"os" json:"os"`
	Arch            string             `bson:"arch" json:"arch"`
	User            string             `bson:"user" json:"user"`
	Elevated        bool               `bson:"elevated" json:"elevated"`
	FirstSeen       string             `bson:"firstseen" json:"firstseen"`
	LastSeen        string             `bson:"lastseen" json:"last_seen"`
	IPs             []string           `bson:"ips" json:"ips"`
	Gateway         string             `bson:"gateway" json:"gateway"`
	DNS             []string           `bson:"dns" json:"dns"`
	Persistence     []interface{}      `bson:"persistence" json:"persistence"`
	AntiDebug       bool               `bson:"antidebug" json:"anti_debug"`
	Processes       []ProcessInfo      `bson:"processes" json:"processes"`
	Connections     []ConnInfo         `bson:"connections" json:"connections"`
	CommandsRun     []string           `bson:"commandsrun" json:"commands_executed"`
	FilesAccessed   []FileInfo         `bson:"filesaccessed" json:"files_exfiltrated"`
	// ── Post-exploitation ─────────────────────────────────────────────────────
	WiFiNetworks    []WiFiNetwork      `bson:"wifi_networks" json:"wifi_networks"`
	LocalUsers      []LocalUser        `bson:"local_users" json:"local_users"`
	SecurityProds   []string           `bson:"security_products" json:"security_products"`
	EnvCredentials  []EnvCredential    `bson:"env_credentials" json:"env_credentials"`
	TokenPrivileges []string           `bson:"token_privileges" json:"token_privileges"`
	BrowserProfiles []string           `bson:"browser_profiles" json:"browser_profiles"`
	InstalledApps   []InstalledApp     `bson:"installed_apps" json:"installed_apps"`
	DomainName      string             `bson:"domain_name" json:"domain_name"`
}

// ComputeHash calcula SHA256(contenido_del_log + prevHash).
func (r *AuditReport) ComputeHash(prevHash string) string {
	type content struct {
		AgentID         string         `json:"agent_id"`
		Hostname        string         `json:"hostname"`
		OS              string         `json:"os"`
		Arch            string         `json:"arch"`
		User            string         `json:"user"`
		Elevated        bool           `json:"elevated"`
		FirstSeen       string         `json:"firstseen"`
		LastSeen        string         `json:"last_seen"`
		IPs             []string       `json:"ips"`
		Gateway         string         `json:"gateway"`
		DNS             []string       `json:"dns"`
		Persistence     []interface{}  `json:"persistence"`
		AntiDebug       bool           `json:"anti_debug"`
		Processes       []ProcessInfo  `json:"processes"`
		Connections     []ConnInfo     `json:"connections"`
		CommandsRun     []string       `json:"commands_executed"`
		FilesAccessed   []FileInfo     `json:"files_exfiltrated"`
	}
	c := content{
		AgentID:       r.AgentID,
		Hostname:      r.Hostname,
		OS:            r.OS,
		Arch:          r.Arch,
		User:          r.User,
		Elevated:      r.Elevated,
		FirstSeen:     r.FirstSeen,
		LastSeen:      r.LastSeen,
		IPs:           r.IPs,
		Gateway:       r.Gateway,
		DNS:           r.DNS,
		Persistence:   r.Persistence,
		AntiDebug:     r.AntiDebug,
		Processes:     r.Processes,
		Connections:   r.Connections,
		CommandsRun:   r.CommandsRun,
		FilesAccessed: r.FilesAccessed,
	}
	data, _ := json.Marshal(c)
	input := append(data, []byte(prevHash)...)
	sum := sha256.Sum256(input)
	return hex.EncodeToString(sum[:])
}

type AgentWithReports struct {
	Agent       `bson:",inline"`
	Reports     []AuditReport `bson:"reports" json:"reports"`
	ReportCount int           `bson:"reportCount" json:"reportCount"`
	LastReport  string        `bson:"lastReport,omitempty" json:"lastReport,omitempty"`
}

type ProcessInfo struct {
	PID    int32   `json:"pid"`
	Name   string  `json:"name"`
	CPU    float64 `json:"cpu"`
	Memory float32 `json:"memory"`
}

type ConnInfo struct {
	Protocol string `json:"protocol"`
	Local    string `json:"local"`
	Remote   string `json:"remote"`
	Status   string `json:"status"`
}

type FileInfo struct {
	Path string `json:"path"`
	Hash string `json:"sha256"`
}

type ChainVerification struct {
	Valid       bool   `json:"valid"`
	TotalBlocks int    `json:"total_blocks"`
	TamperedAt  int64  `json:"tampered_at,omitempty"`
	Message     string `json:"message"`
}

func (r *AuditReport) InsertAuditReport() error {
	collection := db.MongoClient.Database("proyecto_grado").Collection("audit_reports")
	if _, err := collection.InsertOne(context.Background(), r); err != nil {
		return err
	}
	return nil
}