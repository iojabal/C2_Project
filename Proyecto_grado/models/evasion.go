package models

type EvasionRequest struct {
	EncryptionKey string `json:"encryption_key"`
	ServerURL     string `json:"server_url"`
	InjectionType string `json:"injection_type"` // "ProcessInjection" | "ProcessHollowing"
	TargetProcess string `json:"target_process"`
	EvasiveMode   bool   `json:"evasive_mode"`
}
