package models

import (
	"context"
	"proyecto_grado/db"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AuditReport struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	AgentID       string             `bson:"agentid" json:"agent_id"`
	Hostname      string             `bson:"hostname" json:"hostname"`
	OS            string             `bson:"os" json:"os"`
	Arch          string             `bson:"arch" json:"arch"`
	User          string             `bson:"user" json:"user"`
	Elevated      bool               `bson:"elevated" json:"elevated"`
	FirstSeen     string             `bson:"firstseen" json:"firstseen"`
	LastSeen      string             `bson:"lastseen" json:"last_seen"`
	IPs           []string           `bson:"ips" json:"ips"`
	Gateway       string             `bson:"gateway" json:"gateway"`
	DNS           []string           `bson:"dns" json:"dns"`
	Persistence   []interface{}      `bson:"persistence" json:"persistence"`
	AntiDebug     bool               `bson:"antidebug" json:"antidebug"`
	Processes     []ProcessInfo      `bson:"processes" json:"processes"`
	Connections   []ConnInfo         `bson:"connections" json:"connections"`
	CommandsRun   []string           `bson:"commandsrun" json:"commands_executed"`
	FilesAccessed []FileInfo         `bson:"filesaccessed" json:"files_exfiltrated"`
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

func (r *AuditReport) InsertAuditReport() error {
	collection := db.MongoClient.Database("proyecto_grado").Collection("audit_reports")
	if _, err := collection.InsertOne(context.Background(), r); err != nil {
		return err
	}
	return nil
}
