package report

type ProcessInfo struct {
	PID    int32   `json:"pid"`
	Name   string  `json:"name"`
	CPU    float64 `json:"cpu"`
	Memory float32 `json:"memory"`
}
