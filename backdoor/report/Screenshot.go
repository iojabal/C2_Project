package report

type Screenshot struct {
	Timestamp string `json:"timestamp"`
	Path      string `json:"path"`
}

type Event struct {
	Timestamp string `json:"timestamp"`
	Action    string `json:"action"`
}
