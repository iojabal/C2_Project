package report

type ConnInfo struct {
	Protocol string `json:"protocol"`
	Local    string `json:"local"`
	Remote   string `json:"remote"`
	Status   string `json:"status"`
}
