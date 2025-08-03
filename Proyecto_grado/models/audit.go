package models

import (
	"context"
	"proyecto_grado/db"
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

func (r *AuditReport) InsertAuditReport() error {
	collection := db.MongoClient.Database("proyecto_grado").Collection("audit_reports")
	if _, err := collection.InsertOne(context.Background(), r); err != nil {
		return err
	}
	return nil
}
